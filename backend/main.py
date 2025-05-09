# main.py
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import logging
import requests
import tensorflow as tf
import keras
from keras import layers, metrics
import numpy as np
import pickle
import uvicorn
import traceback
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

# Load environment
load_dotenv()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Spotify Recommender")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================
# Keras Custom Classes
# ======================

@keras.utils.register_keras_serializable()
class BalancedPlaylistModel(keras.Model):
    def __init__(self, num_playlists, num_tracks, embedding_size, **kwargs):
        super().__init__(**kwargs)
        self.num_playlists = num_playlists
        self.num_tracks = num_tracks
        self.embedding_size = embedding_size
        self.playlist_gate = layers.Dense(embedding_size, activation='sigmoid')
        self.track_gate = layers.Dense(embedding_size, activation='sigmoid')
        self.playlist_embedding = layers.Embedding(
            num_playlists, embedding_size,
            embeddings_regularizer=keras.regularizers.l1_l2(1e-8, 1e-8))
        self.track_embedding = layers.Embedding(
            num_tracks, embedding_size,
            embeddings_regularizer=keras.regularizers.l1_l2(1e-8, 1e-8))
        self.dropout = layers.Dropout(0.3, noise_shape=(None, 1))

    def call(self, inputs, training=None):
        pl_idx, tr_idx = inputs[:, 0], inputs[:, 1]
        pl_emb = self.playlist_embedding(pl_idx)
        tr_emb = self.track_embedding(tr_idx)
        pl_emb = pl_emb * self.playlist_gate(pl_emb)
        tr_emb = tr_emb * self.track_gate(tr_emb)

        if training:
            pl_emb = self.dropout(pl_emb, training=True)
            tr_emb = self.dropout(tr_emb, training=True)
            self.dropout.rate = min(0.7, self.dropout.rate + 0.02)

        logits = tf.reduce_sum(pl_emb * tr_emb, axis=1) / 0.2
        return tf.sigmoid(logits)

    def get_config(self):
        return {
            'num_playlists': self.num_playlists,
            'num_tracks': self.num_tracks,
            'embedding_size': self.embedding_size
        }

@keras.utils.register_keras_serializable()
class BinaryF1Score(metrics.Metric):
    def __init__(self, name='f1_score', threshold=0.5, **kwargs):
        super().__init__(name=name, **kwargs)
        self.threshold = threshold
        self.precision = metrics.Precision(thresholds=threshold)
        self.recall = metrics.Recall(thresholds=threshold)

    def update_state(self, y_true, y_pred, sample_weight=None):
        y_pred = tf.cast(y_pred >= self.threshold, tf.float32)
        self.precision.update_state(y_true, y_pred, sample_weight)
        self.recall.update_state(y_true, y_pred, sample_weight)

    def result(self):
        p = self.precision.result()
        r = self.recall.result()
        return 2 * ((p * r) / (p + r + 1e-6))

    def reset_state(self):
        self.precision.reset_state()
        self.recall.reset_state()

# ======================
# Recommender Class
# ======================

class PlaylistRecommender:
    def __init__(self, model, track_index_to_uri, playlist_id_to_index, playlist_index_to_id):
        self.model = model
        self.track_index_to_uri = track_index_to_uri
        self.track_uri_to_index = {v: k for k, v in track_index_to_uri.items()}
        self.playlist_id_to_index = playlist_id_to_index
        self.playlist_index_to_id = playlist_index_to_id

    def recommend_for_playlist(self, playlist_id, top_k=10):
        playlist_idx = self.playlist_id_to_index[playlist_id]
        all_tracks = np.arange(len(self.track_index_to_uri))
        inputs = np.array([[playlist_idx, t] for t in all_tracks])
        scores = self.model.predict(inputs, verbose=0).flatten()
        top_k_indices = np.argsort(scores)[-top_k:][::-1]
        return [self.track_index_to_uri[idx] for idx in top_k_indices]

    def recommend_for_new_playlist(self, track_uris, top_k=10):
        track_indices = [self.track_uri_to_index[uri] for uri in track_uris if uri in self.track_uri_to_index]
        playlist_vec = np.mean([self.model.track_embedding(tf.constant([idx])) for idx in track_indices], axis=0)
        all_vectors = self.model.track_embedding.weights[0]
        sims = tf.reduce_sum(playlist_vec * all_vectors, axis=1) / 0.2
        probs = tf.sigmoid(sims)
        top_indices = np.argsort(probs)[-top_k - len(track_indices):][::-1]
        return [self.track_index_to_uri[i] for i in top_indices if i not in track_indices][:top_k]

# ======================
# Helpers
# ======================

def extract_playlist_id(url: str) -> Optional[str]:
    if not url:
        return None

    if "open.spotify.com/playlist/" in url:
        try:
            return url.split("playlist/")[1].split("?")[0]
        except IndexError:
            return None
    elif "spotify:playlist:" in url:
        return url.split(":")[-1]
    elif len(url) == 22:
        return url
    return None


def get_spotify_token():
    try:
        resp = requests.post(
            "https://accounts.spotify.com/api/token",
            auth=(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET),
            data={"grant_type": "client_credentials"}
        )
        resp.raise_for_status()
        return resp.json()['access_token']
    except Exception as e:
        logger.error(f"Spotify auth failed: {e}")
        raise HTTPException(status_code=401, detail="Spotify auth failed")

def get_playlist_tracks(playlist_id: str):
    token = get_spotify_token()
    headers = {"Authorization": f"Bearer {token}"}
    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit=100"
    all_tracks = []

    while url:
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            logger.error(f"❌ Failed to fetch tracks for playlist {playlist_id}: {resp.status_code}")
            logger.error(f"Response: {resp.json()}")
            break

        data = resp.json()
        for item in data.get("items", []):
            uri = item.get("track", {}).get("uri")
            if uri:
                all_tracks.append(uri)
        url = data.get("next")

    if not all_tracks:
        logger.warning(f"⚠️ No tracks found or playlist might be private: {playlist_id}")
    return all_tracks

def get_track_details(track_uris: list):
    if not track_uris:
        return []

    try:
        token = get_spotify_token()
        headers = {'Authorization': f'Bearer {token}'}
        track_ids = [uri.split(':')[-1] for uri in track_uris if uri.startswith('spotify:track:')]

        chunks = [track_ids[i:i+50] for i in range(0, len(track_ids), 50)]  # Spotify limit = 50
        full_tracks = []

        for chunk in chunks:
            res = requests.get(
                f'https://api.spotify.com/v1/tracks?ids={",".join(chunk)}',
                headers=headers
            )
            if res.status_code != 200:
                continue
            full_tracks.extend(res.json().get("tracks", []))

        return full_tracks
    except Exception as e:
        logger.error(f"Track details fetch failed: {str(e)}")
        return []


# ======================
# FastAPI Setup
# ======================

class PlaylistRequest(BaseModel):
    playlist_url: str
    limit: int = 20

@app.on_event("startup")
async def load_model_and_recommender():
    global model, recommender
    try:
        model = tf.keras.models.load_model(
            "Collaborative_Filtering.keras",
            custom_objects={
                'BalancedPlaylistModel': BalancedPlaylistModel,
                'BinaryF1Score': BinaryF1Score
            }
        )
        with open("playlist_recommender.pkl", "rb") as f:
            recommender = pickle.load(f)
            if isinstance(recommender, PlaylistRecommender):
                recommender.model = model
                # ✅ PATCH missing attribute
                if not hasattr(recommender, "track_uri_to_index"):
                    recommender.track_uri_to_index = {
                        uri: idx for idx, uri in recommender.track_index_to_uri.items()
                    }

        logger.info("✅ Model and recommender loaded.")
    except Exception as e:
        logger.error(f"❌ Failed to load: {e}")
        traceback.print_exc()
        model = None
        recommender = None

@app.get("/")
async def root():
    return {"status": "alive", "model": model is not None}

@app.get("/debug/status")
async def debug_status():
    return {
        "model_loaded": model is not None,
        "recommender_loaded": recommender is not None,
        "playlist_count": len(recommender.playlist_id_to_index) if recommender else 0,
        "track_count": len(recommender.track_index_to_uri) if recommender else 0
    }

@app.post("/recommend")
async def recommend(request: PlaylistRequest):
    playlist_id = extract_playlist_id(request.playlist_url)
    if not playlist_id:
        raise HTTPException(status_code=400, detail="Invalid playlist URL or ID")

    track_uris = get_playlist_tracks(playlist_id)
    if not track_uris:
        logger.warning(f"⚠️ No tracks found or playlist might be private: {playlist_id}")
        raise HTTPException(status_code=404, detail="Playlist not found or private")

    try:
        if model and recommender:
            if playlist_id in recommender.playlist_id_to_index:
                recommended_uris = recommender.recommend_for_playlist(playlist_id, request.limit)
                method = "collaborative"
            else:
                recommended_uris = recommender.recommend_for_new_playlist(track_uris, request.limit)
                method = "cold_start"
        else:
            recommended_uris = track_uris[:request.limit]
            method = "demo"

        # Get full metadata
        metadata = get_track_details(recommended_uris)

        if not metadata:
            raise HTTPException(status_code=500, detail="Failed to fetch track metadata")

        return {
            "method": method,
            "recommendations": metadata
        }

    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

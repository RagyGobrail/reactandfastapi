import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import axios from 'axios';

function SearchResults({ tracks }) {
    const [embedTrack, setEmbedTrack] = useState(null);
    const [feedback, setFeedback] = useState({});
    // Load feedback from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("track_feedback");
        if (stored) {
            setFeedback(JSON.parse(stored));
        }
    }, []);

    // Save feedback to localStorage
    const updateFeedback = (trackUri, type) => {
    setFeedback(prev => {
        const newFeedback = {
            ...prev,
            [trackUri]: prev[trackUri] === type ? null : type
        };
        localStorage.setItem("track_feedback", JSON.stringify(newFeedback));
        return newFeedback;
    });
};

    const handleSpotifyClick = (trackId, index) => {
        setEmbedTrack(prev =>
            prev?.index === index && prev?.type === 'spotify'
                ? null
                : { type: 'spotify', id: trackId, index }
        );
    };

    const handleYouTubeClick = async (query, index) => {
        if (embedTrack?.type === 'youtube' && embedTrack?.index === index) {
            setEmbedTrack(null);
            return;
        }

        try {
            const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    q: query,
                    key: 'AIzaSyAlfUGHUfPxuMe8k3llyPHdoyCo9ScpOTo',
                    maxResults: 1,
                    type: 'video'
                }
            });

            const videoId = res.data.items[0]?.id?.videoId;
            if (videoId) {
                setEmbedTrack({ type: 'youtube', id: videoId, index });
            }
        } catch (err) {
            console.error('YouTube API error:', err);
        }
    };

    const getTrackUris = () => {
        return tracks
            .filter(t => t.track?.uri)
            .map(t => t.track.uri);
    };

    const createSpotifyPlaylist = async (name) => {
        const token = localStorage.getItem("spotify_access_token");
        const userRes = await fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await userRes.json();
        const userId = userData.id;

        const res = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name })
        });

        const data = await res.json();
        return data.id;
    };

    const addTracksToPlaylist = async (playlistId, uris) => {
        const token = localStorage.getItem("spotify_access_token");

        const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ uris })
        });

        return res.ok;
    };

    const handleSavePlaylist = async () => {
        const token = localStorage.getItem("spotify_access_token");
        if (!token) return alert("Please login to Spotify first.");

        const uris = getTrackUris();
        if (!uris.length) return alert("No tracks to save.");

        try {
            const playlistId = await createSpotifyPlaylist("My Generated Playlist");
            const success = await addTracksToPlaylist(playlistId, uris);
            alert(success ? "Playlist saved!" : "Failed to add tracks.");
        } catch (err) {
            console.error("Save playlist error:", err);
            alert("Something went wrong while saving.");
        }
    };

    return (
        <AnimatePresence>
            {tracks && tracks.length > 0 && (
                <motion.div
                    id="search-results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.6 }}
                >
                    <button className="savePlaylistButton" onClick={handleSavePlaylist}>
                        Save in Spotify as Playlist!
                    </button>

                    {tracks.map((track, index) => {
                        const id = track.track?.id || `fallback-${index}`;
                        const name = track.track?.name || "Unknown Title";
                        const artist = track.track?.artists?.[0]?.name || "Unknown Artist";
                        const image = track.track?.album?.images?.[0]?.url || "https://via.placeholder.com/64";
                        const query = `${name} ${artist}`;
                        const trackUri = track.track?.uri;
                        const feedbackValue = feedback[trackUri];

                        return (
                            <div key={id}>
                                <div className="track-item">
                                    <img src={image} alt="Cover" className="track-image" />
                                    <div className="track-info">
                                        <div className="track-name">{name}</div>
                                        <div className="track-artist">{artist}</div>
                                    </div>

                                    <div className="track-icons">
                                        <div className="feedback-icons">
                                            <FaThumbsUp
                                                onClick={() => updateFeedback(trackUri, 'like')}
                                                size={20}
                                                color={feedbackValue === 'like' ? '#0059ff' : '#ccc'}
                                                style={{ marginRight: '8px', cursor: 'pointer' }}
                                            />
                                            <FaThumbsDown
                                                onClick={() => updateFeedback(track.track.uri, 'dislike')}
                                                size={20}
                                                color={feedbackValue === 'dislike' ? '#FF4C4C' : '#ccc'}
                                                style={{ marginRight: '12px', cursor: 'pointer' }}
                                            />
                                        </div>
                                        <img
                                            src="src/assets/Spotify_logo.png"
                                            className="spotify-icon"
                                            alt="Spotify"
                                            onClick={() => handleSpotifyClick(id, index)}
                                        />
                                        <img
                                            src="src/assets/youtube-logo1.png"
                                            className="youtube-icon"
                                            alt="YouTube"
                                            onClick={() => handleYouTubeClick(query, index)}
                                        />
                                    </div>
                                </div>

                                {embedTrack?.index === index && (
                                    <div className="embed-container">
                                        {embedTrack.type === 'spotify' ? (
                                            <iframe
                                                style={{ borderRadius: '12px' }}
                                                src={`https://open.spotify.com/embed/track/${embedTrack.id}?utm_source=generator&theme=0`}
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        ) : (
                                            <iframe
                                                width="560"
                                                height="315"
                                                src={`https://www.youtube.com/embed/${embedTrack.id}`}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                            ></iframe>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default SearchResults;

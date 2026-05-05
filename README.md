# 🎵 AI Music Recommendation System

An AI-powered music recommendation platform that helps users discover songs based on their preferences, mood, and search queries.

This project combines **collaborative filtering**, **NLP-based search**, and **external APIs (Spotify & YouTube)** to create a smart and interactive music experience.

---

## 🚀 Features

* 🎧 Personalized music recommendations using collaborative filtering
* 🔍 Natural Language Search (e.g. "sad chill songs at night")
* 📂 Playlist-based recommendation system
* 🔗 Integration with Spotify API for metadata
* ▶️ YouTube integration for playback
* ⚡ FastAPI backend for high performance

---

## 🧠 AI Components

### 1. Collaborative Filtering

* Built using Keras with negative sampling
* Learns user-playlist-track relationships
* Suggests tracks based on similar user behavior

### 2. NLP Search

* Uses NLP models (e.g. BERT / SpaCy / NLTK)
* Converts user queries into meaningful search results

---

## 🛠️ Tech Stack

**Frontend**

* React.js

**Backend**

* FastAPI
* Python

**AI / ML**

* Keras
* NumPy / Pandas
* NLP libraries (SpaCy / NLTK / Transformers)

**APIs**

* Spotify API
* YouTube Data API

---

## 📁 Project Structure

```
/frontend   → React application
/backend    → FastAPI server + ML models
```

---

## ⚙️ Installation

### 1. Clone the repo

```
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2. Backend setup

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend setup

```
cd frontend
npm install
npm start
```

---

## 🔗 How It Works

1. User enters a query or selects a playlist
2. NLP processes the input (if text-based)
3. Recommendation model suggests tracks
4. Data is enriched via Spotify API
5. Songs are played via YouTube

---

## 📌 Future Improvements

* Voice-based search 🎤
* Real-time recommendation updates
* Better deep learning models
* Mobile app deployment (Flutter)

---

## 🤝 Contributing

Contributions are welcome. Feel free to open issues or submit pull requests.

---

## 📜 License

This project is licensed under the MIT License.

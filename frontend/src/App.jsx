import React, { useState, useEffect } from 'react';
import Header from './Header';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import { motion } from 'framer-motion';
import './App.css';
import FloatingDots from './components/FloatingDots';
import FeatureShowcase from './components/FeatureShowcase';
import MoodSelector from './MoodSelector';
import { fetchMoodTracks } from './moodService';
import { generateRandomString, generateCodeChallenge } from './utils';

const CLIENT_ID = '69502891fbf84d65b1b8f6815894e7e7';
const REDIRECT_URI = 'http://localhost:5173/callback';
const SCOPES = 'user-read-private user-read-email streaming';

function App() {
  const [token, setToken] = useState(null);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [discoverMode, setDiscoverMode] = useState(null);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);


  // Add this inside your App component
const handleGenerateMoodSongs = async () => {
  setIsLoading(true);
  try {
    // Get tracks based on mood (replace with real API call)
    const moodTracks = await fetchMoodTracks([selectedMood], 20);

    // Format to match your existing track structure
    const formattedTracks = moodTracks.map(track => ({
      track: {
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: track.album,
        uri: track.uri,
        external_urls: {spotify: `https://open.spotify.com/track/${track.id}`}
      }
    }));

    setTracks(formattedTracks);
  } catch (error) {
    console.error("Mood track generation failed:", error);
    alert("Could not generate mood playlist");
  } finally {
    setIsLoading(false);
  }
};

  // Exchange code for token on first load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const codeVerifier = localStorage.getItem('code_verifier');

    if (code && !token) {
      fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          code_verifier: codeVerifier
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            setToken(data.access_token);
            localStorage.setItem("spotify_access_token", data.access_token);
            window.history.replaceState({}, null, '/');
          } else {
            console.error("Token exchange failed:", data);
          }
        });
    } else {
      const stored = localStorage.getItem("spotify_access_token");
      if (stored) setToken(stored);
    }
  }, []);

  // Fetch available genres after getting token
  useEffect(() => {
    if (token) {
      fetch("https://api.spotify.com/v1/recommendations/available-genre-seeds", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setAvailableGenres(data.genres);
          console.log("✅ Available Spotify genres:", data.genres);
        })
        .catch(err => {
          console.error("Error fetching genre seeds:", err);
        });
    }
  }, [token]);

  const login = async () => {
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    localStorage.setItem('code_verifier', codeVerifier);

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `response_type=code&client_id=${CLIENT_ID}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&code_challenge_method=S256&code_challenge=${codeChallenge}`;

    window.location.href = authUrl;
  };

  return (
    <div className="App">
      <FloatingDots />
      <Header setDiscoverMode={(mode) => {
        setDiscoverMode(mode);
        setSearchResults([]);
        setTracks([]);
      }} />

      <div className="wrapper">
        <motion.div
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1, ease: "easeOut" }}
  style={{
    position: 'relative',
    zIndex: 50,
    marginTop: '150px',
    marginBottom: '40px',
    textAlign: 'center'
  }}
>
  <h1 style={{
    color: 'rgba(149,251,249,0.6)', // Bright cyan fallback
    background: 'linear-gradient(90deg, #00fffc, #00ff9d, #ff00f7)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    fontSize: '3.5rem',
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '3px', // Increased for neon effect
    fontFamily: "'Monoton', sans-serif",
    margin: '0',
    padding: '0 20px',
    textShadow: `
      0 0 5px #00fffc,
      0 0 10px #00fffc,
      0 0 20px #00ff9d,
      0 0 40px #ff00f7,
      0 0 80px #ff00f7
    `,
    animation: 'neon-pulse 1.5s ease-in-out infinite alternate',
    WebkitTextStroke: '0.5px rgba(255,255,255,0.8)' // Better edge definition
  }}>
    Discover More<br />About Your Mood!
  </h1>
</motion.div>

        {!discoverMode && <FeatureShowcase />}

        {discoverMode === "taste" && (
          <SearchBar setSearchQuery={setSearchQuery} setTracks={setTracks} />
        )}

        {discoverMode === "mood" && (
          <>
            <MoodSelector
              selectedMoods={selectedMoods}
              setSelectedMoods={setSelectedMoods}
              onGenerate={handleGenerateMoodSongs}
              isLoading={isLoading}
            />
            {tracks.length > 0 && <SearchResults tracks={tracks} />}
          </>
        )}

        {discoverMode === "taste" && tracks.length > 0 && (
          <SearchResults tracks={tracks} />
        )}
      </div>
    </div>
  );
}

export default App;
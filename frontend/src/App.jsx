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
import PlaylistAnalyzer from './components/PlaylistAnalyzer';

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
  const [analysisData, setAnalysisData] = useState(null);

const handleGenerateMoodSongs = async () => {
  if (!selectedMoods.length) return;
  setIsLoading(true);
  try {
    const moodTracks = await fetchMoodTracks(selectedMoods, 20);
    const formattedTracks = moodTracks.map(track => ({
      track: {
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: track.album,
        uri: track.uri,
        external_urls: track.external_urls
      }
    }));
    setTracks(formattedTracks);
  } catch (err) {
    console.error("Failed to load mood tracks:", err);
    alert("Login to Spotify First.");
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
        {discoverMode !== "mood" && (
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
          color: 'rgba(255,255,255,0.9)', // Bright cyan fallback
          lineHeight: '1',
          letterSpacing: '2.5px', // Increased for neon effect
          fontFamily: "'Ysabeau Infant'",
          fontWeight: 'Bold',
          fontSize: '84px',
          padding: '0 20px',
          marginBottom: '28px'
        }}>
          Harmonyǎ
        </h1>

          <h1
            style={{
          color: 'rgba(255,255,255,0.7)', // Bright cyan fallback
          lineHeight: '1',
          letterSpacing: '1.5px', // Increased for neon effect
          fontFamily: "'Ysabeau Infant'",
          fontWeight: 'Thin',
          fontStyle: 'italic',
          fontSize: '40px',
          padding: '0 20px',
          marginTop: '0'
        }}>
          Serendipity in Sinc
          </h1>
        </motion.div>
        )}

        {!discoverMode && <FeatureShowcase setDiscoverMode={setDiscoverMode} />}

        {discoverMode === "taste" && (
            <>
            <h className="moodTitle">Discover By Your Taste</h>
            <SearchBar mode="recommend" setTracks={setTracks} />
            </>
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

        {discoverMode === "analyze" && (
          <>
            <h className="moodTitle">Analyze Your Playlist</h>
            <SearchBar mode="analyze" setAnalysisData={setAnalysisData} />
            <PlaylistAnalyzer analysisData={analysisData} />
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
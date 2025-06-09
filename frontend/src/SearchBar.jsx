import React, { useState } from 'react';

function SearchBar({ setTracks, setAnalysisData, mode = 'recommend' }) {
  const [query, setQuery] = useState('');

  const handleSearch = async () => {
    if (!query.startsWith("https://open.spotify.com/playlist/")) {
      alert("Please enter a valid Spotify playlist URL.");
      return;
    }

    const playlistId = query.split("playlist/")[1]?.split("?")[0];
    const token = localStorage.getItem("spotify_access_token");

    if (mode === 'recommend') {
      try {
        const response = await fetch("http://localhost:8000/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playlist_url: query,
            limit: 20
          })
        });

        const data = await response.json();

        if (!response.ok) {
          alert(`Backend Error ${response.status}: ${data.detail || "Unknown"}`);
          return;
        }

        if (!data.recommendations || data.recommendations.length === 0) {
          alert("No recommendations found.");
          return;
        }

        const formattedTracks = data.recommendations.map(t => ({
          track: {
            id: t.id,
            name: t.name,
            artists: t.artists,
            album: t.album,
            uri: t.uri,
            external_urls: t.external_urls
          }
        }));

        setTracks(formattedTracks);
      } catch (error) {
        console.error("Fetch failed:", error);
        alert("Could not fetch recommendations.");
      }
    }

    if (mode === 'analyze') {
      try {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const playlist = await res.json();

        const tracks = playlist.tracks.items
          .map(item => item.track)
          .filter(Boolean);

        const total = tracks.length;
        const popular = [...tracks].sort((a, b) => b.popularity - a.popularity).slice(0, 5);
        const totalDuration = tracks.reduce((sum, t) => sum + t.duration_ms, 0);
        const avgPopularity = tracks.reduce((sum, t) => sum + t.popularity, 0) / total;

        const artistCount = {};
        tracks.forEach(t => {
          t.artists.forEach(a => {
            artistCount[a.name] = (artistCount[a.name] || 0) + 1;
          });
        });

        const topArtists = Object.entries(artistCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => `${name} (${count} tracks)`);

        setAnalysisData({
          name: playlist.name,
          image: playlist.images[0]?.url,
          total,
          topArtists,
          topTracks: popular,
          avgDuration: (totalDuration / total / 60000).toFixed(2), // mins
          avgPopularity: avgPopularity.toFixed(1)
        });
      } catch (err) {
        console.error("Analysis failed:", err);
        alert("Could not analyze playlist. Log in to Spotify!");
      }
    }
  };

  return (
    <div className="container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter Spotify Playlist Link"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          onClick={(e) => e.target.select()}
        />
        <button type="button" onClick={handleSearch}>
          <img src="src/assets/search.png" alt="Search" />
        </button>
      </div>
    </div>
  );
}

export default SearchBar;

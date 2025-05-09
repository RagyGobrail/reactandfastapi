import React, { useState } from 'react';

function SearchBar({ setTracks }) {
    const [query, setQuery] = useState("");

    const handleSearch = async () => {
        if (!query.startsWith("https://open.spotify.com/playlist/")) {
            alert("Please enter a valid Spotify playlist URL.");
            return;
        }

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

            // Format minimal info from URI
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

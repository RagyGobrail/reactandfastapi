import React from 'react';
import './PlaylistAnalyzer.css'; // Ensure this CSS file exists and is imported

const PlaylistAnalyzer = ({ analysisData }) => {
  if (!analysisData) {
    return (
      <div className="analyzer-container empty">
      </div>
    );
  }

  return (
    <div className="analyzer-container">
      <div className="playlist-header">
        <img className="playlist-cover" src={analysisData.image} alt="playlist cover" />
        <h3 className="playlist-title">{analysisData.name}</h3>
      </div>

      <div className="playlist-stats">
        <p><strong>Total Tracks:</strong> {analysisData.total}</p>
        <p><strong>Avg Duration:</strong> {analysisData.avgDuration} min</p>
        <p><strong>Avg Popularity:</strong> {analysisData.avgPopularity}</p>
      </div>

      <div className="ranking-columns">
        <div className="ranking-section">
          <h4>Top Tracks</h4>
          <ol className="ranking-list">
            {analysisData.topTracks.map((track, index) => (
              <li key={track.id} className="ranking-item">
                <span className="rank">#{index + 1}</span>
                <img src={track.album.images[0]?.url} alt={track.name} className="track-cover" />
                <div className="track-details">
                  <span className="track-name">{track.name}</span>
                  <span className="track-artist">{track.artists.map(a => a.name).join(', ')}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="ranking-section">
          <h4>Top Artists</h4>
          <ol className="ranking-list">
            {analysisData.topArtists.map((artist, index) => (
              <li key={index} className="ranking-item artist-style">
                <span className="rank">#{index + 1}</span>
                <div className="artist-details">
                  <span className="track-name">{artist}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PlaylistAnalyzer;

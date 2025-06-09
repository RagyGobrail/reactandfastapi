// moodService.js

// Playlist IDs (just examples — replace with your real ones)
const MOOD_PLAYLISTS = {
  happy: "0RH319xCjeU8VyTSqCF6M4",
  sad: "2XRyCthDk0L8ZK85YPjVwh",
  chill: "63aOMpGXakIizfhsXu6p9E",
  energetic: "0oxevpSGR2zITpujzwPCmj",
  dancy: "18vUeZ9BdtMRNV6gI8RnR6"
};

// Helper to fetch tracks from a playlist
const fetchPlaylistTracks = async (playlistId, limit = 100) => {
  const token = localStorage.getItem("spotify_access_token");
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();

  return data.items
    .map(item => item.track)
    .filter(Boolean);
};

// Shuffle helper
const getRandomSubset = (arr, count) => {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
};

// Main export
export const fetchMoodTracks = async (moods, limit = 20) => {
  if (!moods || moods.length === 0) return [];

  if (moods.length === 1) {
    const playlistId = MOOD_PLAYLISTS[moods[0]];
    const tracks = await fetchPlaylistTracks(playlistId);
    return getRandomSubset(tracks, limit);
  }

  if (moods.length === 2) {
    const playlistId1 = MOOD_PLAYLISTS[moods[0]];
    const playlistId2 = MOOD_PLAYLISTS[moods[1]];

    const [tracks1, tracks2] = await Promise.all([
      fetchPlaylistTracks(playlistId1),
      fetchPlaylistTracks(playlistId2)
    ]);

    return [
      ...getRandomSubset(tracks1, Math.floor(limit / 2)),
      ...getRandomSubset(tracks2, Math.ceil(limit / 2))
    ];
  }

  return [];
};

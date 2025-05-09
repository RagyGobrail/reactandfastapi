// utils/MoodService.js
export const fetchMoodTracks = async (moods, limit) => {
  // For demo purposes - in production, replace with actual API calls
  const mockMoodTracks = {
    happy: [
      {id: '11dFghVXANMlKmJXsNCbNl', name: 'Happy', artists: [{name: 'Pharrell Williams'}], album: {images: [{url: 'https://i.scdn.co/image/ab67616d0000b273e1d9c660d6be8a8a69f6bf37'}]}, uri: 'spotify:track:11dFghVXANMlKmJXsNCbNl'},
      // Add more mock tracks...
    ],
    sad: [
      {id: '3EEd6ldsPat620GVYMEhOP', name: 'Someone Like You', artists: [{name: 'Adele'}], album: {images: [{url: 'https://i.scdn.co/image/ab67616d0000b273e1d9c660d6be8a8a69f6bf37'}]}, uri: 'spotify:track:3EEd6ldsPat620GVYMEhOP'},
      // Add more mock tracks...
    ]
  };

  // Combine tracks from all selected moods
  const allTracks = moods.flatMap(mood => mockMoodTracks[mood.toLowerCase()] || []);

  // Shuffle and limit
  return [...allTracks].sort(() => 0.5 - Math.random()).slice(0, limit);
};
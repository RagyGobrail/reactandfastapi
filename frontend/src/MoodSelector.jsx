import React from "react";

const moodOptions = [
  { id: 'happy', name: 'Happy', emoji: '😊' },
  { id: 'sad', name: 'Sad', emoji: '😢' },
  { id: 'chill', name: 'Chill', emoji: '🍃' },
  { id: 'energetic', name: 'Energetic', emoji: '⚡' },
  { id: 'dancy', name: 'Dancy', emoji: '💃' }
];

export default function MoodSelector({ selectedMoods, setSelectedMoods, onGenerate, isLoading }) {
  const toggleMood = (moodId) => {
    setSelectedMoods(prev => {
      // If mood is already selected, remove it
      if (prev.includes(moodId)) {
        return prev.filter(m => m !== moodId);
      }
      // Otherwise add it, but only if we have less than 2 selected
      if (prev.length < 2) {
        return [...prev, moodId];
      }
      // If we already have 2 selected, don't change
      return prev;
    });
  };

  return (
    <div className="mood-selector-container">
      <h2 className="mood-title">Select Your Mood</h2>

      <div className="mood-row">
        {moodOptions.map((mood) => (
          <div
            key={mood.id}
            className={`mood-card ${selectedMoods.includes(mood.id) ? 'selected' : ''} ${
              selectedMoods.length >= 2 && !selectedMoods.includes(mood.id) ? 'disabled' : ''
            }`}
            onClick={() => toggleMood(mood.id)}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-name">{mood.name}</span>
          </div>
        ))}
      </div>

      <button
        className={`generate-btn ${!selectedMoods.length || isLoading ? 'disabled' : ''}`}
        onClick={onGenerate}
        disabled={!selectedMoods.length || isLoading}
      >
        {isLoading ? 'Generating...' : 'Find Songs'}
      </button>
    </div>
  );
}
import { useState, useEffect } from 'react';

export const DEFAULT_WORKOUT_SEQUENCE = [
  { id: 'wordBubbles', name: 'Word Bubbles' },
  { id: 'starSearch', name: 'Star Search' },
  { id: 'troubleBrewing', name: 'Trouble Brewing' },
  { id: 'tidalTreasures', name: 'Tidal Treasures' },
  { id: 'colorMatch', name: 'Color Match' }
];

export function useSettings() {
  const [workoutSequence, setWorkoutSequence] = useState(() => {
    const saved = localStorage.getItem('bettyWorkoutSequence');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved workout sequence", e);
      }
    }
    return DEFAULT_WORKOUT_SEQUENCE;
  });

  useEffect(() => {
    localStorage.setItem('bettyWorkoutSequence', JSON.stringify(workoutSequence));
  }, [workoutSequence]);

  const updateWorkoutSequence = (newSequence) => {
    setWorkoutSequence(newSequence);
  };

  return {
    workoutSequence,
    updateWorkoutSequence
  };
}

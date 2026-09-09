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
        const parsed = JSON.parse(saved);
        // Handle migration from old format where it was just an array
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return parsed.sequence || DEFAULT_WORKOUT_SEQUENCE;
      } catch (e) {
        console.error("Failed to parse saved workout sequence", e);
      }
    }
    return DEFAULT_WORKOUT_SEQUENCE;
  });

  const [difficulty, setDifficulty] = useState(() => {
    const saved = localStorage.getItem('bettyWorkoutSequence');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) && parsed.difficulty) {
           return parsed.difficulty;
        }
      } catch (e) {}
    }
    return 'beginner'; // beginner, intermediate, advanced
  });

  const [timerMode, setTimerMode] = useState(() => {
    const saved = localStorage.getItem('bettyWorkoutSequence');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) && parsed.timerMode !== undefined) {
           return parsed.timerMode;
        }
      } catch (e) {}
    }
    return true; 
  });

  const [motionMode, setMotionMode] = useState(() => {
    const saved = localStorage.getItem('bettyWorkoutSequence');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) && parsed.motionMode !== undefined) {
           return parsed.motionMode;
        }
      } catch (e) {}
    }
    return true; // Default to true since she likes Lumosity versions
  });

  useEffect(() => {
    localStorage.setItem('bettyWorkoutSequence', JSON.stringify({
      sequence: workoutSequence,
      difficulty: difficulty,
      timerMode: timerMode,
      motionMode: motionMode
    }));
  }, [workoutSequence, difficulty, timerMode, motionMode]);

  const updateWorkoutSequence = (newSequence) => {
    setWorkoutSequence(newSequence);
  };

  const updateDifficulty = (newDiff) => {
    setDifficulty(newDiff);
  };

  const updateTimerMode = (newMode) => {
    setTimerMode(newMode);
  };

  const updateMotionMode = (newMode) => {
    setMotionMode(newMode);
  };

  return {
    workoutSequence,
    updateWorkoutSequence,
    difficulty,
    updateDifficulty,
    timerMode,
    updateTimerMode,
    motionMode,
    updateMotionMode
  };
}

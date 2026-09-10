import { useState, useEffect } from 'react';

const STORAGE_KEY = 'betty_brain_progression';

const INITIAL_LEVELS = {
  wordBubbles: 1,
  starSearch: 1,
  troubleBrewing: 1,
  tidalTreasures: 1,
  colorMatch: 1,
  mathMaster: 1,
  wordScramble: 1,
  triviaTime: 1,
  patternRecall: 1,
  directionalDash: 1,
  simonSays: 1,
  tetris: 1,
  snake: 1,
  memoryMatch: 1,
  minesweeper: 1,
  whackAMole: 1,
  flowerGuess: 1,
  wordSearch: 1,
  spotTheDifference: 1,
  ticTacToe: 1,
  blackjack: 1,
  slots: 1,
  breakout: 1,
  etClimb: 1
};

export function useProgression() {
  const [levels, setLevels] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...INITIAL_LEVELS, ...JSON.parse(saved) };
    }
    return INITIAL_LEVELS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
  }, [levels]);

  const levelUp = (gameId) => {
    setLevels(prev => ({
      ...prev,
      [gameId]: Math.min((prev[gameId] || 1) + 1, 5) // Max level 5
    }));
  };

  const getLevel = (gameId) => {
    return levels[gameId] || 1;
  };

  return { levels, levelUp, getLevel };
}

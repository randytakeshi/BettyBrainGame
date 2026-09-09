import { useState, useEffect } from 'react';

const STORAGE_KEY = 'betty_brain_score_data';

export function useScore() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      
      // If it's a new day
      if (parsed.lastPlayed !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        // If they played yesterday, keep streak, else reset
        const newStreak = (parsed.lastPlayed === yesterday) ? parsed.streak : 0;
        
        return {
          score: 0,
          streak: newStreak,
          lastPlayed: today,
          totalScore: parsed.totalScore || 0
        };
      }
      return parsed;
    }
    
    // Initial state
    return {
      score: 0,
      streak: 0,
      lastPlayed: new Date().toDateString(),
      totalScore: 0
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addScore = (points) => {
    setData(prev => {
      let newStreak = prev.streak;
      // Increment streak for the first time scoring today
      if (prev.score === 0 && points > 0) {
        newStreak += 1;
      }
      return {
        ...prev,
        score: prev.score + points,
        totalScore: (prev.totalScore || 0) + points,
        streak: newStreak,
        lastPlayed: new Date().toDateString()
      };
    });
  };

  return { ...data, addScore };
}

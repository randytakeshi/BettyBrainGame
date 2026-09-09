import { useState, useEffect } from 'react';

const STORAGE_KEY = 'betty_brain_score_data';

export function useScore() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Migrate old data missing history
      if (!parsed.history) {
        parsed.history = [{ date: parsed.lastPlayed || today, score: parsed.totalScore || 0 }];
      }

      // If it's a new day
      if (parsed.lastPlayed !== today) {
        const yesterdayDate = new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // If they played yesterday, keep streak, else reset
        const newStreak = (parsed.lastPlayed === yesterdayDate) ? parsed.streak : 0;
        
        return {
          score: 0,
          streak: newStreak,
          lastPlayed: today,
          totalScore: parsed.totalScore || 0,
          history: [...parsed.history, { date: today, score: 0 }].slice(-30) // Keep last 30 days
        };
      }
      return parsed;
    }
    
    // Initial state
    return {
      score: 0,
      streak: 0,
      lastPlayed: today,
      totalScore: 0,
      history: [{ date: today, score: 0 }]
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
      
      const newScore = prev.score + points;
      const newTotalScore = (prev.totalScore || 0) + points;
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Update history for today
      let newHistory = [...(prev.history || [])];
      const todayIndex = newHistory.findIndex(h => h.date === today);
      
      if (todayIndex >= 0) {
        newHistory[todayIndex] = { date: today, score: newHistory[todayIndex].score + points };
      } else {
        newHistory.push({ date: today, score: points });
        if (newHistory.length > 30) newHistory.shift();
      }

      return {
        ...prev,
        score: newScore,
        totalScore: newTotalScore,
        streak: newStreak,
        lastPlayed: today,
        history: newHistory
      };
    });
  };

  return { ...data, addScore };
}

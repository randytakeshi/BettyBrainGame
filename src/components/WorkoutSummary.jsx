import React from 'react';

export function WorkoutSummary({ totalScore, streak, onFinish }) {
  return (
    <div className="transition-screen pop-in">
      <div style={{ fontSize: '5rem', marginBottom: 'var(--spacing-sm)' }} aria-hidden="true">🏆</div>

      <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Workout Complete!</h1>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', maxWidth: 520 }}>
        Wonderful work today, Betty. Your brain thanks you!
      </p>

      <div className="results-stats" style={{ maxWidth: 560 }}>
        <div className="results-stat">
          <div className="results-stat-value" style={{ color: 'var(--brand)' }}>+{totalScore}</div>
          <div className="results-stat-label">Points Earned</div>
        </div>
        <div className="results-stat">
          <div className="results-stat-value" style={{ color: 'var(--gold)' }}>🔥 {streak}</div>
          <div className="results-stat-label">Day Streak</div>
        </div>
      </div>

      <button className="primary big" style={{ width: '100%', maxWidth: 460 }} onClick={onFinish}>
        Return to Home
      </button>
    </div>
  );
}

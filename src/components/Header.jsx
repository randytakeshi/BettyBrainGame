import React from 'react';

export function Header({ score, streak }) {
  return (
    <header className="app-header">
      <h1 className="brand-title"><span aria-hidden="true">🧠</span> Betty Brain</h1>
      <div className="score-display">
        <div className="score-pill" title="Days in a row you have played">
          <span className="score-label">🔥 Streak</span>
          <span className="score-value">{streak}</span>
        </div>
        <div className="score-pill" title="Points earned today">
          <span className="score-label">⭐ Today</span>
          <span className="score-value">{score}</span>
        </div>
      </div>
    </header>
  );
}

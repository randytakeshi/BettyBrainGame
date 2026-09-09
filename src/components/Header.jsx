import React from 'react';

export function Header({ score, streak }) {
  return (
    <header className="app-header">
      <h1 className="brand-title">Betty Brain</h1>
      <div className="score-display">
        <span className="score-label">🔥 Streak:</span>
        <span className="score-value">{streak}</span>
        <span className="score-label" style={{marginLeft: 'var(--spacing-md)'}}>⭐ Score:</span>
        <span className="score-value">{score}</span>
      </div>
    </header>
  );
}

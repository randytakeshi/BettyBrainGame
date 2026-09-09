import React from 'react';

export function Intermission({ lastGameName, lastGameResult, nextGameName, gameIndex = 0, totalGames = 5, onNext }) {
  return (
    <div className="transition-screen pop-in">
      <div className="workout-progress-dots" aria-label={`${gameIndex + 1} of ${totalGames} games finished`}>
        {Array.from({ length: totalGames }, (_, i) => (
          <span
            key={i}
            className={
              'workout-progress-dot' +
              (i <= gameIndex ? ' done' : i === gameIndex + 1 ? ' current' : '')
            }
          />
        ))}
      </div>

      <div className="card" style={{ width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-xs)' }} aria-hidden="true">✅</div>
        <h2 style={{ marginBottom: 'var(--spacing-xs)' }}>{lastGameName} finished</h2>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
          +{lastGameResult.score} points
          {lastGameResult.isPerfect && ' · Perfect game! 🌟'}
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 'var(--spacing-sm)' }}>
          {gameIndex + 1} of {totalGames} games done — keep going!
        </p>
      </div>

      <p className="results-score-label" style={{ marginBottom: 4 }}>Up Next</p>
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>{nextGameName}</h2>

      <button className="primary big" style={{ width: '100%', maxWidth: 460 }} onClick={onNext}>
        Start Next Game →
      </button>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

export function SpeedBonusBar({ duration = 60, maxBonus = 50 }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const widthPercent = Math.max(0, (timeLeft / duration) * 100);
  const currentBonus = Math.max(0, Math.floor((timeLeft / duration) * maxBonus));

  return (
    <div style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        color: 'var(--gold)',
      }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em' }}>🚀 SPEED BONUS</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>+{currentBonus} pts</span>
      </div>
      <div style={{
        width: '100%',
        height: 18,
        backgroundColor: 'var(--surface-highlight)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        border: '2px solid var(--border-strong)',
      }}>
        <div style={{
          width: `${widthPercent}%`,
          height: '100%',
          backgroundColor: 'var(--gold-bright)',
          transition: 'width 1s linear',
        }} />
      </div>
    </div>
  );
}

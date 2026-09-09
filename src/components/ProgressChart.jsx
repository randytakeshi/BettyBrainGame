import React from 'react';

export function ProgressChart({ history = [] }) {
  const recentHistory = history.slice(-7);

  if (recentHistory.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 'var(--spacing-lg)' }}>
        Play a game to start tracking your progress!
      </div>
    );
  }

  const maxScore = Math.max(500, ...recentHistory.map(day => day.score));

  return (
    <section className="progress-card">
      <h3 style={{ textAlign: 'center' }}>Your Last 7 Days</h3>

      <div className="progress-bars">
        {recentHistory.map((day, index) => {
          const heightPercent = Math.max(4, (day.score / maxScore) * 100);
          const isToday = index === recentHistory.length - 1;
          const [month, dayNum] = day.date.split(' ');

          return (
            <div key={index} className="progress-col">
              <div
                className="progress-value"
                style={{ color: isToday ? 'var(--brand)' : 'var(--text-primary)' }}
              >
                {day.score}
              </div>
              <div
                className={'progress-bar' + (isToday ? ' today' : '')}
                style={{ height: `${heightPercent}%` }}
              />
              <div className="progress-date" style={{ fontWeight: isToday ? 700 : 400 }}>
                {isToday ? 'Today' : <>{month}<br />{dayNum}</>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

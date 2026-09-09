import React from 'react';

export function WorkoutSummary({ totalScore, streak, onFinish }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto',
      padding: 'var(--spacing-xl) var(--spacing-md)'
    }}>
      
      <div style={{ fontSize: '5rem', marginBottom: 'var(--spacing-md)' }}>
        🏆
      </div>
      
      <h1 style={{ fontSize: '3rem', marginBottom: 'var(--spacing-lg)' }}>
        Workout Complete!
      </h1>
      
      <p style={{ 
        fontSize: '1.5rem', 
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        You did fantastic today. Keep up the great work!
      </p>

      <div style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        width: '100%',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <div style={{
          flex: 1,
          backgroundColor: 'var(--surface-color)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Points Earned</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            +{totalScore}
          </div>
        </div>
        
        <div style={{
          flex: 1,
          backgroundColor: 'var(--surface-color)',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Daily Streak</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-warning)' }}>
            🔥 {streak}
          </div>
        </div>
      </div>

      <button 
        className="primary" 
        onClick={onFinish}
        style={{ width: '100%', fontSize: '2rem', padding: 'var(--spacing-lg)' }}
      >
        Return to Dashboard
      </button>

    </div>
  );
}

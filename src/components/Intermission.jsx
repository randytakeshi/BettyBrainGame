import React from 'react';

export function Intermission({ lastGameName, lastGameResult, nextGameName, onNext }) {
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
      
      <div style={{
        backgroundColor: 'var(--surface-color)',
        padding: 'var(--spacing-xl)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <h2 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
          {lastGameName} Complete!
        </h2>
        
        <div style={{ 
          fontSize: '4rem', 
          fontWeight: 'bold', 
          color: 'var(--accent-primary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Score: {lastGameResult.score}%
        </div>
        
        {lastGameResult.isPerfect && (
          <div style={{
            color: 'var(--accent-success)',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginTop: 'var(--spacing-md)',
            animation: 'pulse 2s infinite'
          }}>
            🌟 Level Up Unlocked for Tomorrow! 🌟
          </div>
        )}
      </div>

      <div style={{ width: '100%' }}>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '1.2rem',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Up Next
        </p>
        <h3 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-xl)' }}>
          {nextGameName}
        </h3>
        
        <button 
          className="primary" 
          onClick={onNext}
          style={{ width: '100%', fontSize: '2rem', padding: 'var(--spacing-lg)' }}
        >
          Start Next Game
        </button>
      </div>

    </div>
  );
}

import React from 'react';

export function Dashboard({ onStartWorkout, onEditRoutine, onSelectGame }) {
  const coreGames = [
    { id: 'wordBubbles', title: 'Word Bubbles', category: 'LANGUAGE', icon: '🫧' },
    { id: 'starSearch', title: 'Star Search', category: 'ATTENTION', icon: '⭐' },
    { id: 'troubleBrewing', title: 'Trouble Brewing', category: 'ATTENTION', icon: '☕' },
    { id: 'tidalTreasures', title: 'Tidal Treasures', category: 'MEMORY', icon: '🐚' },
    { id: 'colorMatch', title: 'Color Match', category: 'FLEXIBILITY', icon: '🎨' },
  ];

  const bonusGames = [
    { id: 'mathMaster', title: 'Math Master', category: 'LOGIC', icon: '➕' },
    { id: 'wordScramble', title: 'Word Scramble', category: 'LANGUAGE', icon: '🔠' },
    { id: 'triviaTime', title: 'Trivia Time', category: 'KNOWLEDGE', icon: '💡' },
    { id: 'patternRecall', title: 'Pattern Recall', category: 'MEMORY', icon: '🧩' },
    { id: 'directionalDash', title: 'Directional Dash', category: 'SPEED', icon: '➡️' },
    { id: 'simonSays', title: 'Simon Says', category: 'MEMORY', icon: '🎵' },
    { id: 'tetris', title: 'Betty Blocks', category: 'SPATIAL', icon: '🧱' },
    { id: 'snake', title: 'Betty Snake', category: 'PLANNING', icon: '🐍' },
    { id: 'memoryMatch', title: 'Memory Match', category: 'MEMORY', icon: '🃏' },
    { id: 'minesweeper', title: 'Betty Minesweeper', category: 'LOGIC', icon: '💣' },
    { id: 'whackAMole', title: 'Whack-A-Mole', category: 'SPEED', icon: '🐹' },
    { id: 'flowerGuess', title: 'Flower Guess', category: 'LANGUAGE', icon: '🌸' },
    { id: 'wordSearch', title: 'Word Search', category: 'LANGUAGE', icon: '🔎' },
    { id: 'spotTheDifference', title: 'Spot the Difference', category: 'ATTENTION', icon: '👀' },
    { id: 'ticTacToe', title: 'Tic-Tac-Toe', category: 'LOGIC', icon: '❌' },
    { id: 'blackjack', title: 'Betty Blackjack', category: 'MATH', icon: '♠️' },
    { id: 'slots', title: 'Betty Slots', category: 'LUCK', icon: '🎰' },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const renderGameList = (gamesList) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      {gamesList.map(game => (
        <div 
          key={game.id} 
          onClick={() => onSelectGame(game.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--surface-color)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'transform 0.1s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{
            fontSize: '2.5rem',
            width: '60px',
            height: '60px',
            backgroundColor: 'var(--surface-highlight)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 'var(--spacing-md)'
          }}>
            {game.icon}
          </div>
          <div style={{ textAlign: 'left', display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 'bold', fontSize: '2rem', marginRight: 'var(--spacing-sm)' }}>{game.title}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', letterSpacing: '1px' }}>
              • {game.category}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', paddingBottom: 'var(--spacing-xl)' }}>
      <div style={{
        backgroundColor: 'var(--surface-color)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-sm)' }}>🧠</div>
        <h2>Daily Workout</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
          {today} | 5 Games
        </p>
         <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <button 
          className="primary" 
          onClick={onStartWorkout}
          style={{ fontSize: '2rem', padding: 'var(--spacing-md) var(--spacing-xl)' }}
        >
          ▶️ Start Daily Workout
        </button>
        <button 
          className="secondary" 
          onClick={onEditRoutine}
          style={{ fontSize: '1.5rem', padding: 'var(--spacing-md) var(--spacing-lg)' }}
        >
          ⚙️ Edit Routine
        </button>
      </div>
      </div>

      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Today's Exercises</h3>
      {renderGameList(coreGames)}

      <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)', color: 'var(--accent-secondary)' }}>
        Bonus Practice Games
      </h3>
      {renderGameList(bonusGames)}
    </div>
  );
}

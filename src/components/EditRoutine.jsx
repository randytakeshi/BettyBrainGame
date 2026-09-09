import React, { useState } from 'react';

// Master list of all games for the customization menu
export const ALL_GAMES = [
  // Core
  { id: 'wordBubbles', name: 'Word Bubbles', icon: '💭' },
  { id: 'starSearch', name: 'Star Search', icon: '⭐' },
  { id: 'troubleBrewing', name: 'Trouble Brewing', icon: '☕' },
  { id: 'tidalTreasures', name: 'Tidal Treasures', icon: '🌊' },
  { id: 'colorMatch', name: 'Color Match', icon: '🎨' },
  
  // Cognitive
  { id: 'mathMaster', name: 'Math Master', icon: '🧮' },
  { id: 'wordScramble', name: 'Word Scramble', icon: '🔠' },
  { id: 'triviaTime', name: 'Trivia Time', icon: '❓' },
  { id: 'patternRecall', name: 'Pattern Recall', icon: '🧩' },
  { id: 'directionalDash', name: 'Directional Dash', icon: '➡️' },
  { id: 'simonSays', name: 'Simon Says', icon: '🎵' },
  
  // Classic
  { id: 'tetris', name: 'Betty Blocks', icon: '🧱' },
  { id: 'snake', name: 'Betty Snake', icon: '🐍' },
  { id: 'memoryMatch', name: 'Memory Match', icon: '🃏' },
  { id: 'minesweeper', name: 'Betty Minesweeper', icon: '💣' },
  { id: 'whackAMole', name: 'Whack-A-Mole', icon: '🐹' },
  
  // Variety
  { id: 'flowerGuess', name: 'Flower Guess', icon: '🌸' },
  { id: 'wordSearch', name: 'Word Search', icon: '🔎' },
  { id: 'spotTheDifference', name: 'Spot the Difference', icon: '👀' },
  { id: 'ticTacToe', name: 'Tic-Tac-Toe', icon: '❌' },
  
  // Casino
  { id: 'blackjack', name: 'Betty Blackjack', icon: '♠️' },
  { id: 'slots', name: 'Betty Slots', icon: '🎰' },
];

export function EditRoutine({ currentSequence, onUpdateSequence, onBack }) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

  const handleSlotClick = (index) => {
    // Toggle selection
    if (selectedSlotIndex === index) {
      setSelectedSlotIndex(null);
    } else {
      setSelectedSlotIndex(index);
    }
  };

  const handleGameSelect = (game) => {
    if (selectedSlotIndex !== null) {
      // Create new sequence, replacing the selected slot
      const newSequence = [...currentSequence];
      newSequence[selectedSlotIndex] = { id: game.id, name: game.name };
      onUpdateSequence(newSequence);
      setSelectedSlotIndex(null); // Clear selection after swap
    }
  };

  return (
    <div className="game-view" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-md)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back to Dashboard</button>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>Edit Daily Routine</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', fontSize: '1.2rem' }}>
        Tap a slot below to select it, then tap any game from the master list to swap it in!
      </p>

      {/* Current Routine */}
      <div style={{
        backgroundColor: 'var(--surface-color)',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--accent-primary)' }}>Your 5 Daily Games</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentSequence.map((game, index) => {
            const isSelected = selectedSlotIndex === index;
            const fullGameInfo = ALL_GAMES.find(g => g.id === game.id) || { icon: '🎮' };
            
            return (
              <button
                key={index}
                onClick={() => handleSlotClick(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.2)' : 'var(--bg-color)',
                  border: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                <div style={{ 
                  backgroundColor: 'var(--surface-highlight)', 
                  width: '40px', 
                  height: '40px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '50%',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: 'var(--text-secondary)'
                }}>
                  {index + 1}
                </div>
                <div style={{ fontSize: '2rem' }}>{fullGameInfo.icon}</div>
                <div style={{ fontSize: '1.5rem', flexGrow: 1, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {game.name}
                </div>
                {isSelected && (
                  <div style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>
                    SELECT REPLACEMENT ⬇️
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Master List */}
      <div style={{
        backgroundColor: 'var(--surface-color)',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        opacity: selectedSlotIndex !== null ? 1 : 0.5,
        pointerEvents: selectedSlotIndex !== null ? 'auto' : 'none',
        transition: 'opacity 0.3s'
      }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--accent-secondary)' }}>
          {selectedSlotIndex !== null ? "Tap a game to swap it into Slot " + (selectedSlotIndex + 1) : "Select a slot above first"}
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '8px'
        }}>
          {ALL_GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => handleGameSelect(game)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-color)',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>{game.icon}</div>
              <div style={{ fontSize: '1.2rem' }}>{game.name}</div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

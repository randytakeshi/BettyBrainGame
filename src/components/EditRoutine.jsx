import React, { useState } from 'react';

// Master list of all games for the customization menu
export const ALL_GAMES = [
  // Core
  { id: 'wordBubbles', name: 'Word Bubbles', icon: '🫧' },
  { id: 'starSearch', name: 'Star Search', icon: '⭐' },
  { id: 'troubleBrewing', name: 'Trouble Brewing', icon: '☕' },
  { id: 'tidalTreasures', name: 'Tidal Treasures', icon: '🐚' },
  { id: 'colorMatch', name: 'Color Match', icon: '🎨' },

  // Cognitive
  { id: 'mathMaster', name: 'Math Master', icon: '➕' },
  { id: 'wordScramble', name: 'Word Scramble', icon: '🔠' },
  { id: 'triviaTime', name: 'Trivia Time', icon: '💡' },
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
  { id: 'bettyWordle', name: 'Betty Wordle', icon: '🟩' },
  { id: 'balloonPop', name: 'Balloon Pop', icon: '🎈' },
  { id: 'bettyBingo', name: 'Betty Bingo', icon: '🎱' },
  { id: 'codeBreaker', name: 'Code Breaker', icon: '🔐' },
  { id: 'bettySlalom', name: 'Betty Slalom', icon: '⛷️' },
  { id: 'breakout', name: 'Betty Breakout', icon: '🏓' },
  { id: 'etClimb', name: 'ET Climb', icon: '🧗' },
  { id: 'hoseLuna', name: 'Hose Luna', icon: '🐕' },
  { id: 'saveNini', name: 'Save Nini', icon: '🐶' },
  { id: 'niniBarks', name: 'Nini Barks!', icon: '🌙' },
  { id: 'bettyBowling', name: 'Betty Bowling', icon: '🎳' },
  { id: 'spotTheDifference', name: 'Spot the Difference', icon: '👀' },
  { id: 'ticTacToe', name: 'Tic-Tac-Toe', icon: '❌' },

  // Casino
  { id: 'blackjack', name: 'Betty Blackjack', icon: '♠️' },
  { id: 'slots', name: 'Betty Slots', icon: '🎰' },
];

export function EditRoutine({
  currentSequence, onUpdateSequence,
  difficulty, onUpdateDifficulty,
  timerMode, onUpdateTimerMode,
  motionMode, onUpdateMotionMode,
  onBack,
}) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

  const handleSlotClick = (index) => {
    setSelectedSlotIndex(selectedSlotIndex === index ? null : index);
  };

  const handleGameSelect = (game) => {
    if (selectedSlotIndex === null) return;
    const newSequence = [...currentSequence];
    newSequence[selectedSlotIndex] = { id: game.id, name: game.name };
    onUpdateSequence(newSequence);
    setSelectedSlotIndex(null);
  };

  return (
    <div className="game-view" style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 'var(--spacing-xl)' }}>
      <div style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}>
        <button className="back-btn" onClick={onBack}>← Back to Home</button>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xs)' }}>Settings &amp; Routine</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
        Choose your difficulty and your five daily games.
      </p>

      {/* Global Difficulty */}
      <section className="settings-section">
        <h3>Difficulty</h3>
        <p>Beginner starts gently. Advanced jumps straight to the hardest level.</p>
        <div className="segmented">
          {['beginner', 'intermediate', 'advanced'].map(d => (
            <button
              key={d}
              className={difficulty === d ? 'selected' : ''}
              onClick={() => onUpdateDifficulty(d)}
            >
              {d === 'beginner' ? '🌱 Beginner' : d === 'intermediate' ? '🌿 Intermediate' : '🌳 Advanced'}
            </button>
          ))}
        </div>
      </section>

      {/* Current Routine */}
      <section className="settings-section">
        <h3>Your 5 Daily Games</h3>
        <p>Tap a slot, then tap a game below to swap it in.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {currentSequence.map((game, index) => {
            const isSelected = selectedSlotIndex === index;
            const fullGameInfo = ALL_GAMES.find(g => g.id === game.id) || { icon: '🎮' };

            return (
              <button
                key={index}
                className={'routine-slot' + (isSelected ? ' selected' : '')}
                onClick={() => handleSlotClick(index)}
              >
                <span className="routine-slot-number">{index + 1}</span>
                <span style={{ fontSize: '1.8rem' }} aria-hidden="true">{fullGameInfo.icon}</span>
                <span style={{ flexGrow: 1, fontWeight: 700 }}>{game.name}</span>
                {isSelected && (
                  <span style={{ color: 'var(--brand)', fontSize: '0.95rem', fontWeight: 700 }}>
                    Pick a replacement ⬇
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Master List */}
      <section
        className="settings-section"
        style={{
          opacity: selectedSlotIndex !== null ? 1 : 0.5,
          pointerEvents: selectedSlotIndex !== null ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      >
        <h3>
          {selectedSlotIndex !== null
            ? `Tap a game for slot ${selectedSlotIndex + 1}`
            : 'Select a slot above first'}
        </h3>
        <div className="game-picker-grid">
          {ALL_GAMES.map((game) => (
            <button key={game.id} onClick={() => handleGameSelect(game)}>
              <span style={{ fontSize: '1.5rem' }} aria-hidden="true">{game.icon}</span>
              <span>{game.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Speed Bonus Toggle */}
      <section className="settings-section">
        <h3>Speed Bonus 🚀</h3>
        <p>
          Adds a bonus bar to your five daily games — finish quickly to earn up to
          50 extra points. Turn it off for a fully relaxed pace.
        </p>
        <button
          className={'toggle-btn' + (timerMode ? ' on' : '')}
          onClick={() => onUpdateTimerMode(!timerMode)}
        >
          {timerMode ? '✓ Speed Bonus is ON' : 'Speed Bonus is OFF'}
        </button>
      </section>

      {/* Motion Mode Toggle */}
      <section className="settings-section">
        <h3>Motion Mode 🎈</h3>
        <p>
          The five daily games use gently moving targets, like the classic Lumosity
          games. Turn it off for still, unhurried versions of the same exercises.
        </p>
        <button
          className={'toggle-btn' + (motionMode ? ' on' : '')}
          onClick={() => onUpdateMotionMode(!motionMode)}
        >
          {motionMode ? '✓ Motion Mode is ON' : 'Motion Mode is OFF'}
        </button>
      </section>
    </div>
  );
}

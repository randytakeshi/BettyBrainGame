import React, { useState, useEffect } from 'react';

const EMOJIS = ['🐶', '🚗', '🍎', '🎸', '🌻', '🚀', '🍔', '🎈'];

const generateDeck = (level) => {
  const numPairs = level === 1 ? 6 : 8; // 12 cards for level 1, 16 for level 2+
  const selectedEmojis = EMOJIS.slice(0, numPairs);
  const deck = [...selectedEmojis, ...selectedEmojis]
    .map((emoji) => ({ emoji, id: Math.random() }))
    .sort(() => Math.random() - 0.5);
  return deck;
};

export function MemoryMatch({ level = 1, onComplete, onBack }) {
  const [deck, setDeck] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIndices, setMatchedIndices] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    setDeck(generateDeck(level));
    setFlippedIndices([]);
    setMatchedIndices([]);
    setMoves(0);
    setIsLocked(false);
  }, [level]);

  const handleCardClick = (index) => {
    if (isLocked) return;
    if (flippedIndices.includes(index) || matchedIndices.includes(index)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(prev => prev + 1);
      const [firstIndex, secondIndex] = newFlipped;
      
      if (deck[firstIndex].emoji === deck[secondIndex].emoji) {
        // Match found
        setMatchedIndices(prev => {
          const newMatched = [...prev, firstIndex, secondIndex];
          if (newMatched.length === deck.length) {
            // Game Over - Win
            setTimeout(() => {
              if (onComplete) onComplete({ score: 100, isPerfect: true });
            }, 1500);
          }
          return newMatched;
        });
        setFlippedIndices([]);
        setIsLocked(false);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1200);
      }
    }
  };

  const cols = deck.length === 12 ? 3 : 4;

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | Moves: {moves}
        </div>
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
        Memory Match
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 'var(--spacing-md)',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        {deck.map((card, index) => {
          const isFlipped = flippedIndices.includes(index);
          const isMatched = matchedIndices.includes(index);
          const isRevealed = isFlipped || isMatched;

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              style={{
                aspectRatio: '3/4',
                backgroundColor: isRevealed ? 'var(--surface-color)' : 'var(--accent-primary)',
                border: isMatched ? '4px solid var(--accent-success)' : 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s',
                transform: isRevealed ? 'scale(1)' : 'scale(1)',
                opacity: isMatched ? 0.7 : 1,
                cursor: isRevealed ? 'default' : 'pointer'
              }}
            >
              {isRevealed ? card.emoji : ''}
            </button>
          );
        })}
      </div>
      
      {matchedIndices.length === deck.length && deck.length > 0 && (
        <div style={{
          marginTop: 'var(--spacing-xl)',
          color: 'var(--accent-success)',
          fontSize: '2rem',
          fontWeight: 'bold',
          textAlign: 'center',
          animation: 'pulse 2s infinite'
        }}>
          🌟 All Matched! 🌟
        </div>
      )}
    </div>
  );
}

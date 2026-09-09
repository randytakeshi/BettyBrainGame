import React, { useState } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const EMOJIS = ['🐶', '🚗', '🍎', '🎸', '🌻', '🚀', '🍔', '🎈'];

function generateDeck(numPairs) {
  const selected = EMOJIS.slice(0, numPairs);
  return [...selected, ...selected]
    .map((emoji) => ({ emoji, id: Math.random() }))
    .sort(() => Math.random() - 0.5);
}

function Playfield({ level, finishGame }) {
  const numPairs = level === 1 ? 6 : 8; // 12 cards for level 1, 16 for level 2+
  const [deck] = useState(() => generateDeck(numPairs));
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const { feedback, showFeedback } = useFeedback(1100);

  const handleCardClick = (index) => {
    if (locked) return;
    if (flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length < 2) return;

    const newMoves = moves + 1;
    setMoves(newMoves);
    const [first, second] = newFlipped;

    if (deck[first].emoji === deck[second].emoji) {
      const newMatched = [...matched, first, second];
      setMatched(newMatched);
      setFlipped([]);

      if (newMatched.length === deck.length) {
        setLocked(true);
        showFeedback('correct', 'You found every pair!');
        // Efficiency scoring: fewer moves = more points, but finishing always wins.
        const score = Math.max(400, 1600 - (newMoves - numPairs) * 60);
        setTimeout(() => {
          finishGame({ score, isPerfect: newMoves <= numPairs + 3 });
        }, 1300);
      }
    } else {
      setLocked(true);
      setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, 1200);
    }
  };

  const cols = numPairs === 6 ? 3 : 4;

  return (
    <>
      <GameHUD
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Moves</span>
              <span className="hud-value">{moves}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Pairs Found</span>
              <span className="hud-value">{matched.length / 2} of {numPairs}</span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Tap two cards to find a matching pair.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 'var(--spacing-sm)',
        width: '100%',
        maxWidth: cols === 3 ? 420 : 540,
        margin: '0 auto',
      }}>
        {deck.map((card, index) => {
          const isFlipped = flipped.includes(index);
          const isMatched = matched.includes(index);
          const isRevealed = isFlipped || isMatched;

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              style={{
                aspectRatio: '3/4',
                minWidth: 0,
                minHeight: 100,
                padding: 0,
                backgroundColor: isRevealed ? 'var(--surface-color)' : 'var(--cat-memory)',
                border: isMatched
                  ? '4px solid var(--success)'
                  : isRevealed
                    ? '3px solid var(--border-strong)'
                    : '3px solid var(--cat-memory)',
                borderRadius: 'var(--radius-md)',
                fontSize: '2.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.3s, border-color 0.3s',
                cursor: isRevealed ? 'default' : 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {isRevealed
                ? card.emoji
                : <span style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: '2.4rem' }} aria-hidden="true">❋</span>}
            </button>
          );
        })}
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function MemoryMatch({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Memory Match"
      icon="🃏"
      category="memory"
      level={level}
      instructions={[
        { icon: '🃏', text: 'All the cards start face down. Tap two to turn them over.' },
        { icon: '🧠', text: 'If they match, they stay open. If not, remember where they were!' },
        { icon: '⭐', text: 'Find every pair. Fewer moves means more points.' },
      ]}
      tip="When a card flips back over, quietly say its picture and its spot to yourself."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

import React, { useState } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const WORDS_DB = [
  'CAT', 'DOG', 'BIRD', 'FISH', 'TREE', 'SUN', 'MOON', 'STAR',
  'CAKE', 'BOOK', 'ROSE', 'HOME', 'LOVE', 'MILK', 'TEA', 'CUP',
  'RAIN', 'SNOW', 'LAKE', 'SONG', 'SHIP', 'KITE', 'FROG', 'DUCK',
  'APPLE', 'HONEY', 'LEMON', 'TULIP', 'DAISY', 'MAPLE', 'CLOUD', 'HEART',
  'CHERRY', 'WINTER', 'PURPLE', 'YELLOW', 'SILVER', 'FLOWER', 'BASKET',
];

function configFor(level) {
  const gridSize = level <= 2 ? 6 : level <= 4 ? 7 : 8;
  const numWords = level <= 2 ? 3 : level <= 4 ? 4 : 5;
  return { gridSize, numWords };
}

function tryPlace(grid, word, gridSize) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const horizontal = Math.random() < 0.5;
    const x = Math.floor(Math.random() * (horizontal ? gridSize - word.length + 1 : gridSize));
    const y = Math.floor(Math.random() * (horizontal ? gridSize : gridSize - word.length + 1));

    let fits = true;
    for (let i = 0; i < word.length; i++) {
      const cell = horizontal ? grid[y][x + i] : grid[y + i][x];
      if (cell !== '' && cell !== word[i]) { fits = false; break; }
    }
    if (fits) {
      for (let i = 0; i < word.length; i++) {
        if (horizontal) grid[y][x + i] = word[i];
        else grid[y + i][x] = word[i];
      }
      return true;
    }
  }
  return false;
}

function generatePuzzle(level) {
  const { gridSize, numWords } = configFor(level);
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));

  const candidates = [...WORDS_DB]
    .filter(w => w.length <= gridSize)
    .sort(() => Math.random() - 0.5);

  const wordsToFind = [];
  for (const word of candidates) {
    if (wordsToFind.length >= numWords) break;
    // Skip words that contain (or fit inside) an already-chosen word — avoids
    // ambiguous overlapping finds like TEA inside TEAPOT.
    if (wordsToFind.some(w => w.includes(word) || word.includes(w))) continue;
    if (tryPlace(grid, word, gridSize)) wordsToFind.push(word);
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x] === '') {
        grid[y][x] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return { grid, wordsToFind, gridSize };
}

function lineBetween(start, end) {
  const coords = [];
  if (start.y === end.y) {
    const min = Math.min(start.x, end.x);
    const max = Math.max(start.x, end.x);
    for (let i = min; i <= max; i++) coords.push({ x: i, y: start.y });
  } else if (start.x === end.x) {
    const min = Math.min(start.y, end.y);
    const max = Math.max(start.y, end.y);
    for (let i = min; i <= max; i++) coords.push({ x: start.x, y: i });
  } else {
    return null; // not a straight line
  }
  return coords;
}

function Playfield({ level, finishGame }) {
  const [puzzle] = useState(() => generatePuzzle(level));
  const { grid, wordsToFind, gridSize } = puzzle;

  const [foundWords, setFoundWords] = useState(() => new Set());
  const [foundCoords, setFoundCoords] = useState(() => new Set());
  const [firstCell, setFirstCell] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [done, setDone] = useState(false);
  const { feedback, showFeedback } = useFeedback(1200);

  const handleCellClick = (x, y) => {
    if (done) return;

    if (!firstCell) {
      setFirstCell({ x, y });
      return;
    }

    // Tapping the same cell again just changes your mind — no penalty.
    if (firstCell.x === x && firstCell.y === y) {
      setFirstCell(null);
      return;
    }

    const coords = lineBetween(firstCell, { x, y });
    setFirstCell(null);

    let match = null;
    if (coords) {
      const forward = coords.map(c => grid[c.y][c.x]).join('');
      const backward = [...forward].reverse().join('');
      if (wordsToFind.includes(forward) && !foundWords.has(forward)) match = forward;
      else if (wordsToFind.includes(backward) && !foundWords.has(backward)) match = backward;
    }

    if (!match) {
      setWrongAttempts(w => w + 1);
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      showFeedback('wrong', 'Not a word — keep looking');
      return;
    }

    const newFound = new Set(foundWords);
    newFound.add(match);
    const newCoords = new Set(foundCoords);
    coords.forEach(c => newCoords.add(`${c.x},${c.y}`));
    setFoundWords(newFound);
    setFoundCoords(newCoords);

    if (newFound.size === wordsToFind.length) {
      setDone(true);
      showFeedback('correct', 'You found every word!');
      setTimeout(() => finishGame({
        score: newFound.size * 150 + 100,
        correct: newFound.size,
        total: wordsToFind.length,
        isPerfect: wrongAttempts <= 2,
      }), 1400);
    } else {
      showFeedback('correct', `You found ${match}!`);
    }
  };

  return (
    <>
      <GameHUD
        score={foundWords.size * 150}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Words</span>
              <span className="hud-value">{foundWords.size} of {wordsToFind.length}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Misses</span>
              <span className="hud-value">{wrongAttempts}</span>
            </div>
          </>
        }
      />

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--spacing-sm)',
        justifyContent: 'center',
        marginBottom: 'var(--spacing-md)',
      }}>
        {wordsToFind.map(w => {
          const found = foundWords.has(w);
          return (
            <div key={w} style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              padding: '4px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: found ? 'var(--success-soft)' : 'var(--surface-color)',
              color: found ? 'var(--success-deep)' : 'var(--text-primary)',
              border: `2px solid ${found ? 'var(--success)' : 'var(--border-strong)'}`,
              textDecoration: found ? 'line-through' : 'none',
            }}>
              {w}
            </div>
          );
        })}
      </div>

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
        {firstCell ? 'Now tap the LAST letter of that word.' : 'Tap the FIRST letter of a word.'}
      </p>

      <div
        className={shaking ? 'shake' : undefined}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: 4,
          width: '100%',
          maxWidth: gridSize * 64,
          padding: 8,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--surface-highlight)',
          border: '2px solid var(--border-strong)',
        }}
      >
        {grid.map((row, y) =>
          row.map((letter, x) => {
            const selected = firstCell && firstCell.x === x && firstCell.y === y;
            const found = foundCoords.has(`${x},${y}`);
            return (
              <button
                key={`${x}-${y}`}
                className="compact"
                onClick={() => handleCellClick(x, y)}
                disabled={done}
                style={{
                  aspectRatio: '1',
                  width: '100%',
                  minHeight: 0,
                  padding: 0,
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: found
                    ? 'var(--success-soft)'
                    : selected ? 'var(--brand)' : 'var(--surface-color)',
                  color: found
                    ? 'var(--success-deep)'
                    : selected ? 'var(--text-on-dark)' : 'var(--text-primary)',
                  border: `2px solid ${found
                    ? 'var(--success)'
                    : selected ? 'var(--brand-strong)' : 'var(--border-color)'}`,
                }}
              >
                {letter}
              </button>
            );
          })
        )}
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function WordSearch({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Word Search"
      icon="🔎"
      category="language"
      level={level}
      instructions={[
        { icon: '🔎', text: 'Hidden words run across or down in the letter grid.' },
        { icon: '👆', text: 'Tap the FIRST letter of a word, then tap its LAST letter.' },
        { icon: '✅', text: 'Find every word on the list to finish the puzzle.' },
      ]}
      tip="Hunt for a word's first letter, then look to the right and down from it."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

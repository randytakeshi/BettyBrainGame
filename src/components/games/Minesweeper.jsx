import React, { useState } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const NUMBER_COLORS = {
  1: '#2563EB',
  2: '#15803D',
  3: '#B45309',
  4: '#7C3AED',
  5: '#DC2626',
};

// Mines are placed AFTER the first tap, never on it or next to it,
// so the first tap is always safe.
function generateBoard(gridSize, numMines, safeX, safeY) {
  const board = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => ({ isMine: false, neighborMines: 0 }))
  );

  let minesPlaced = 0;
  while (minesPlaced < numMines) {
    const x = Math.floor(Math.random() * gridSize);
    const y = Math.floor(Math.random() * gridSize);
    const nearFirstTap = Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1;
    if (!nearFirstTap && !board[y][x].isMine) {
      board[y][x].isMine = true;
      minesPlaced++;
    }
  }

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (board[y][x].isMine) continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize && board[ny][nx].isMine) count++;
        }
      }
      board[y][x].neighborMines = count;
    }
  }

  return board;
}

function floodReveal(board, gridSize, x, y, revealedSet) {
  const key = `${x},${y}`;
  if (revealedSet.has(key)) return revealedSet;
  revealedSet.add(key);

  if (board[y][x].neighborMines === 0 && !board[y][x].isMine) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize) {
          floodReveal(board, gridSize, nx, ny, revealedSet);
        }
      }
    }
  }
  return revealedSet;
}

function Playfield({ level, finishGame }) {
  const gridSize = level <= 2 ? 5 : 6;
  const numMines = level <= 2 ? 3 : level <= 4 ? 4 : 6;
  const totalSafe = gridSize * gridSize - numMines;

  const [board, setBoard] = useState(null); // built on the first tap
  const [revealed, setRevealed] = useState(() => new Set());
  const [flags, setFlags] = useState(() => new Set());
  const [flagMode, setFlagMode] = useState(false);
  const [gameOver, setGameOver] = useState(null); // 'win' | 'lose' | null
  const { feedback, showFeedback } = useFeedback(1300);

  const handleCellTap = (x, y) => {
    if (gameOver) return;
    const key = `${x},${y}`;
    if (revealed.has(key)) return;

    if (flagMode) {
      const newFlags = new Set(flags);
      if (newFlags.has(key)) newFlags.delete(key);
      else newFlags.add(key);
      setFlags(newFlags);
      return;
    }
    if (flags.has(key)) return; // flagged cells are protected from taps

    // First tap: build the board so this cell and its neighbors are mine-free.
    let b = board;
    if (!b) {
      b = generateBoard(gridSize, numMines, x, y);
      setBoard(b);
    }

    if (b[y][x].isMine) {
      setGameOver('lose'); // every mine is shown once the game is lost
      const safeFound = revealed.size;
      showFeedback('wrong', 'Boom — that one hid a mine!');
      setTimeout(() => {
        finishGame({ score: safeFound * 40, correct: safeFound, total: totalSafe, isPerfect: false });
      }, 1600);
      return;
    }

    const newRevealed = floodReveal(b, gridSize, x, y, new Set(revealed));
    setRevealed(newRevealed);
    if (flags.size > 0) {
      setFlags(new Set([...flags].filter((f) => !newRevealed.has(f))));
    }

    if (newRevealed.size === totalSafe) {
      setGameOver('win');
      showFeedback('correct', 'You cleared the whole field!');
      setTimeout(() => {
        finishGame({ score: totalSafe * 40 + 400, correct: totalSafe, total: totalSafe, isPerfect: true });
      }, 1400);
    }
  };

  return (
    <>
      <GameHUD
        score={revealed.size * 40}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Mines</span>
              <span className="hud-value">💣 {numMines}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Safe Spots</span>
              <span className="hud-value">{revealed.size} of {totalSafe}</span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        {flagMode ? 'Flag mode is ON — tap a square to mark it 🚩' : 'Tap a square to reveal it. Numbers count nearby mines.'}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: 6,
        width: '100%',
        maxWidth: gridSize * 80 + 40,
        margin: '0 auto',
        backgroundColor: 'var(--surface-highlight)',
        padding: 8,
        borderRadius: 'var(--radius-md)',
      }}>
        {Array.from({ length: gridSize }, (_, y) =>
          Array.from({ length: gridSize }, (_, x) => {
            const key = `${x},${y}`;
            const cell = board ? board[y][x] : null;
            const showMine = cell?.isMine && gameOver === 'lose';
            const isRevealed = revealed.has(key) || showMine;
            const isFlagged = flags.has(key);

            return (
              <button
                key={key}
                onClick={() => handleCellTap(x, y)}
                disabled={gameOver !== null || isRevealed}
                style={{
                  aspectRatio: '1',
                  minWidth: 0,
                  minHeight: 70,
                  padding: 0,
                  backgroundColor: showMine ? 'var(--error-soft)' : isRevealed ? 'var(--surface-alt)' : 'var(--surface-color)',
                  border: showMine
                    ? '3px solid var(--error)'
                    : isRevealed ? '2px solid var(--border-color)' : '3px solid var(--border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isRevealed ? 'default' : 'pointer',
                  opacity: 1, // keep revealed cells fully readable even while "disabled"
                }}
              >
                {isRevealed && cell?.isMine && '💣'}
                {isRevealed && cell && !cell.isMine && cell.neighborMines > 0 && (
                  <span style={{ color: NUMBER_COLORS[cell.neighborMines] || 'var(--text-primary)' }}>
                    {cell.neighborMines}
                  </span>
                )}
                {!isRevealed && isFlagged && '🚩'}
              </button>
            );
          })
        )}
      </div>

      <button
        className={flagMode ? 'primary' : 'secondary'}
        onClick={() => setFlagMode(!flagMode)}
        disabled={gameOver !== null}
        style={{ marginTop: 'var(--spacing-md)', width: '100%', maxWidth: 460 }}
      >
        🚩 Flag Mode: {flagMode ? 'ON' : 'OFF'}
      </button>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function Minesweeper({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Betty Minesweeper"
      icon="💣"
      category="logic"
      level={level}
      instructions={[
        { icon: '👆', text: 'Tap squares to reveal them. Your first tap is always safe!' },
        { icon: '🔢', text: 'A number tells you how many mines touch that square.' },
        { icon: '🚩', text: 'Turn on Flag Mode to mark squares you think hide a mine.' },
      ]}
      tip="Every safe square you reveal earns points — even if a mine gets you in the end."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

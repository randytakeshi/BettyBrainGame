import React, { useState, useEffect, useRef } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const GRID_SIZE = 10;
const WIN_APPLES = 5;

/** setInterval as a hook — callback always sees the latest render. */
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function generateFood(snake) {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
  return newFood;
}

const INITIAL_SNAKE = [{ x: 2, y: 5 }, { x: 1, y: 5 }];

function Playfield({ level, finishGame }) {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 7, y: 5 });
  const [apples, setApples] = useState(0);
  const [running, setRunning] = useState(true);
  const { feedback, showFeedback } = useFeedback(1200);

  // Direction actually applied on the last tick vs. the one queued by the
  // D-pad — comparing against the applied one makes quick double-taps safe
  // (you can never turn 180° into yourself between two ticks).
  const appliedDirRef = useRef({ x: 1, y: 0 });
  const queuedDirRef = useRef({ x: 1, y: 0 });
  const endTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(endTimeoutRef.current), []);

  // Gentle pacing: 900ms per tick at level 1, down to 500ms at level 5.
  const tickDelay = Math.max(500, 900 - (Math.min(level, 5) - 1) * 100);

  const endGame = (won, appleCount, detail) => {
    setRunning(false);
    if (won) {
      showFeedback('correct', 'You ate all 5 apples!');
    } else {
      showFeedback('wrong', detail);
    }
    endTimeoutRef.current = setTimeout(() => {
      finishGame({
        score: appleCount * 200 + (won ? 200 : 0),
        correct: appleCount,
        total: WIN_APPLES,
        isPerfect: won,
      });
    }, 1400);
  };

  useInterval(() => {
    if (!running) return;

    const dir = queuedDirRef.current;
    appliedDirRef.current = dir;

    const head = snake[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      endGame(false, apples, 'The snake hit the wall');
      return;
    }

    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      endGame(false, apples, 'The snake bumped into itself');
      return;
    }

    const newSnake = [newHead, ...snake];

    if (newHead.x === food.x && newHead.y === food.y) {
      const newApples = apples + 1;
      setApples(newApples);
      if (newApples >= WIN_APPLES) {
        setSnake(newSnake);
        endGame(true, newApples);
        return;
      }
      setFood(generateFood(newSnake));
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, running ? tickDelay : null);

  const changeDirection = (newDir) => {
    if (!running) return;
    const applied = appliedDirRef.current;
    if (newDir.x === -applied.x && newDir.y === -applied.y) return; // no 180° turns
    queuedDirRef.current = newDir;
  };

  const cellSize = 'clamp(28px, 9vw, 46px)';

  return (
    <>
      <GameHUD
        score={apples * 200}
        extra={
          <div className="hud-item">
            <span className="hud-label">Apples</span>
            <span className="hud-value">🍎 {apples} of {WIN_APPLES}</span>
          </div>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Steer the snake to the apple. The pink edge is the wall!
      </p>

      <div style={{
        display: 'grid',
        gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize})`,
        gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize})`,
        gap: '2px',
        backgroundColor: 'var(--border-color)',
        border: '4px solid var(--border-strong)',
        borderRadius: 'var(--radius-sm)',
        maxWidth: 480,
        marginBottom: 'var(--spacing-md)',
      }}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);

          const isHead = snake[0].x === x && snake[0].y === y;
          const isSnake = !isHead && snake.some(s => s.x === x && s.y === y);
          const isFood = food.x === x && food.y === y;
          const isEdge = x === 0 || y === 0 || x === GRID_SIZE - 1 || y === GRID_SIZE - 1;

          return (
            <div key={i} style={{
              backgroundColor: isHead
                ? '#064E3B'
                : isSnake
                  ? 'var(--cat-flexibility)'
                  : isEdge
                    ? 'var(--error-soft)'   // 1-tile warning border: the wall is close!
                    : 'var(--surface-color)',
              borderRadius: isHead || isSnake ? '8px' : '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isHead ? '0.85rem' : '1.5rem',
              lineHeight: 1,
            }}>
              {isHead ? '👀' : isFood ? '🍎' : ''}
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 'var(--spacing-sm)',
        width: '100%',
        maxWidth: 420,
      }}>
        <div />
        <button
          onClick={() => changeDirection({ x: 0, y: -1 })}
          disabled={!running}
          aria-label="Up"
          style={{ fontSize: '2rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-strong)', height: 90 }}
        >
          ⬆️
        </button>
        <div />
        <button
          onClick={() => changeDirection({ x: -1, y: 0 })}
          disabled={!running}
          aria-label="Left"
          style={{ fontSize: '2rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-strong)', height: 90 }}
        >
          ⬅️
        </button>
        <button
          onClick={() => changeDirection({ x: 0, y: 1 })}
          disabled={!running}
          aria-label="Down"
          style={{ fontSize: '2rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-strong)', height: 90 }}
        >
          ⬇️
        </button>
        <button
          onClick={() => changeDirection({ x: 1, y: 0 })}
          disabled={!running}
          aria-label="Right"
          style={{ fontSize: '2rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-strong)', height: 90 }}
        >
          ➡️
        </button>
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function Snake({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Betty Snake"
      icon="🐍"
      category="speed"
      level={level}
      instructions={[
        { icon: '🍎', text: 'Steer the snake with the arrow buttons to eat the apples.' },
        { icon: '🧱', text: 'Stay away from the walls — the pink edge tiles mean danger!' },
        { icon: '🏆', text: 'Eat 5 apples to win. The snake grows with every bite.' },
      ]}
      tip="Plan your turn one tile early — the snake keeps gliding while you think."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

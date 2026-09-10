import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const COLS = 4;
const TOTAL_PITCHES = 2;
const MAX_GRIPS = 2;
const HOLD_SIZE = 66;
const ROW_H = 84;

const POINTS_PER_ROW = 100;
const SUMMIT_BONUS = 300;

// Irregular border radii make each hold look like a real rock jug
const ROCK_SHAPES = [
  '48% 52% 55% 45% / 55% 48% 52% 45%',
  '55% 45% 42% 58% / 48% 55% 45% 52%',
  '42% 58% 52% 48% / 52% 42% 58% 48%',
  '58% 42% 48% 52% / 45% 58% 42% 55%',
];
const ROCK_COLORS = ['#A8917A', '#9C8468', '#B09B82', '#8F7A61'];

function settingsFor(level) {
  return {
    rows: [0, 5, 6, 6, 7, 7][Math.min(level, 5)],
    crackedPerRow: level <= 2 ? 1 : 2,
  };
}

/**
 * Build one wall. Guarantees: the start hold is solid, and every solid hold
 * below the top row can reach (col ±1) at least one solid hold above it —
 * so a careful climber is never stuck, no matter which solid path she takes.
 */
function makeWall(rows, crackedPerRow) {
  const grid = Array.from({ length: rows }, () => Array(COLS).fill(null));

  // Guaranteed solid path, wandering at most one column per row
  let col = 1 + Math.floor(Math.random() * 2);
  const startCol = col;
  for (let r = 0; r < rows; r++) {
    grid[r][col] = 'solid';
    col = Math.max(0, Math.min(COLS - 1, col + (Math.floor(Math.random() * 3) - 1)));
  }

  // A few extra solid holds so there is more than one honest route
  for (let r = 0; r < rows; r++) {
    if (Math.random() < 0.6) {
      const c = Math.floor(Math.random() * COLS);
      if (!grid[r][c]) grid[r][c] = 'solid';
    }
  }

  // Repair connectivity: every solid hold must reach a solid hold above
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== 'solid') continue;
      const neighbors = [c - 1, c, c + 1].filter(n => n >= 0 && n < COLS);
      if (!neighbors.some(n => grid[r + 1][n] === 'solid')) {
        const n = neighbors[Math.floor(Math.random() * neighbors.length)];
        grid[r + 1][n] = 'solid';
      }
    }
  }

  // Cracked decoys in the remaining gaps
  for (let r = 1; r < rows; r++) {
    const empties = [];
    for (let c = 0; c < COLS; c++) if (!grid[r][c]) empties.push(c);
    empties.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(crackedPerRow, empties.length); i++) {
      grid[r][empties[i]] = 'cracked';
    }
  }

  return { grid, startCol };
}

function Playfield({ level, finishGame }) {
  const { rows, crackedPerRow } = settingsFor(level);
  const { feedback, showFeedback } = useFeedback(1100);

  const [pitch, setPitch] = useState(1);
  const [wall, setWall] = useState(() => makeWall(rows, crackedPerRow));
  const [phase, setPhase] = useState('study'); // 'study' | 'climb'
  const [pos, setPos] = useState({ row: 0, col: null }); // col set from wall below
  const [grips, setGrips] = useState(MAX_GRIPS);
  const [score, setScore] = useState(0);
  const [rowsClimbed, setRowsClimbed] = useState(0);
  const [slips, setSlips] = useState(0);
  const [locked, setLocked] = useState(false);
  const [hint, setHint] = useState('');
  const [shakeCell, setShakeCell] = useState(null);
  const endedRef = useRef(false);

  const totalMoves = (rows - 1) * TOTAL_PITCHES;

  // Place the climber on the wall's start hold whenever a new wall arrives
  useEffect(() => {
    setPos({ row: 0, col: wall.startCol });
    setPhase('study');
    setHint('');
  }, [wall]);

  // Generous study time, then the cracks camouflage themselves
  useEffect(() => {
    if (phase !== 'study') return;
    const timer = setTimeout(() => setPhase('climb'), 5000 + rows * 1500);
    return () => clearTimeout(timer);
  }, [phase, rows]);

  const endGame = useCallback((finalScore, climbed, slipCount, summited) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setLocked(true);
    setTimeout(() => finishGame({
      score: finalScore,
      correct: climbed,
      total: totalMoves,
      isPerfect: summited && slipCount === 0,
    }), 1300);
  }, [finishGame, totalMoves]);

  const nextPitch = useCallback(() => {
    setPitch(p => p + 1);
    setWall(makeWall(rows, crackedPerRow));
    setLocked(false);
  }, [rows, crackedPerRow]);

  const handleHoldTap = (r, c) => {
    if (phase !== 'climb' || locked || endedRef.current) return;
    const kind = wall.grid[r]?.[c];
    if (!kind || kind === 'crumbled') return;

    const reachable = r === pos.row + 1 && Math.abs(c - pos.col) <= 1;
    if (!reachable) {
      setShakeCell(`${r}-${c}`);
      setTimeout(() => setShakeCell(null), 400);
      setHint(r <= pos.row ? 'Climb upward — pick a hold on the ledge above you.' : 'Too far! Pick a hold just above you, straight up or diagonal.');
      return;
    }

    if (kind === 'cracked') {
      // The hold crumbles under her hand — she keeps her place but loses a grip
      const newGrips = grips - 1;
      const newSlips = slips + 1;
      setGrips(newGrips);
      setSlips(newSlips);
      setWall(w => {
        const grid = w.grid.map(row => [...row]);
        grid[r][c] = 'crumbled';
        return { ...w, grid };
      });
      if (newGrips <= 0) {
        showFeedback('wrong', `That hold was cracked! You climbed ${rowsClimbed} ledges.`);
        endGame(score, rowsClimbed, newSlips, false);
      } else {
        showFeedback('wrong', `That hold was cracked! ${newGrips} grip left — try another.`);
        setHint('');
      }
      return;
    }

    // Solid — climb!
    const newScore = score + POINTS_PER_ROW;
    const newClimbed = rowsClimbed + 1;
    setPos({ row: r, col: c });
    setScore(newScore);
    setRowsClimbed(newClimbed);
    setHint('');

    if (r === rows - 1) {
      // Top of this wall
      if (pitch >= TOTAL_PITCHES) {
        showFeedback('correct', '👽 You reached ET! Out of this world!');
        endGame(newScore + SUMMIT_BONUS, newClimbed, slips, true);
      } else {
        showFeedback('correct', `Pitch ${pitch} climbed! Higher we go…`);
        setLocked(true);
        setTimeout(nextPitch, 1400);
      }
    }
  };

  const paneH = rows * ROW_H + 130;

  return (
    <>
      <GameHUD
        score={score}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Pitch</span>
              <span className="hud-value">{pitch} of {TOTAL_PITCHES}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Grips</span>
              <span className="hud-value">
                {Array.from({ length: MAX_GRIPS }, (_, i) => (i < grips ? '🧤' : '🩶')).join(' ')}
              </span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        {phase === 'study'
          ? '🔍 Study the wall — the cracked holds are marked in red!'
          : 'Climb! Tap a hold just above you. Which ones were cracked?'}
      </p>

      <div style={{
        width: '100%',
        maxWidth: 560,
        height: paneH,
        position: 'relative',
        background: 'linear-gradient(180deg, #DCEBF7 0%, #E9E2D0 30%, #CBB99D 100%)',
        border: '3px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 'var(--spacing-sm)',
      }}>
        {/* ET waits at the summit */}
        <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontSize: '2.4rem', lineHeight: 1.2 }}>
          👽
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ET</div>
        </div>

        {wall.grid.map((rowCells, r) => rowCells.map((kind, c) => {
          if (!kind) return null;
          const key = `${r}-${c}`;
          const top = paneH - 90 - (r + 1) * ROW_H;
          const left = `calc(${(c + 0.5) * (100 / COLS)}% - ${HOLD_SIZE / 2}px)`;
          if (kind === 'crumbled') {
            return (
              <div key={key} style={{ position: 'absolute', top, left, width: HOLD_SIZE, textAlign: 'center', fontSize: '1.2rem', opacity: 0.6 }}>
                💥
              </div>
            );
          }
          const showCrack = kind === 'cracked' && phase === 'study';
          const reachable = phase === 'climb' && r === pos.row + 1 && Math.abs(c - pos.col) <= 1;
          const shapeIdx = (r * COLS + c) % 4;
          return (
            <button
              key={key}
              className={'compact' + (shakeCell === key ? ' shake' : '')}
              data-reachable={reachable || undefined}
              aria-label={showCrack ? 'Cracked hold — avoid this one' : 'Rock hold'}
              onClick={() => handleHoldTap(r, c)}
              style={{
                position: 'absolute',
                top,
                left,
                width: HOLD_SIZE,
                height: HOLD_SIZE,
                minHeight: HOLD_SIZE,
                padding: 0,
                borderRadius: ROCK_SHAPES[shapeIdx],
                backgroundColor: showCrack ? '#E8B4A0' : ROCK_COLORS[shapeIdx],
                border: showCrack
                  ? '4px solid var(--error)'
                  : reachable
                    ? '4px solid var(--brand)'
                    : '3px solid rgba(80, 60, 40, 0.35)',
                boxShadow: reachable
                  ? '0 0 0 5px rgba(194, 65, 12, 0.25), inset 0 -5px 0 rgba(0,0,0,0.18)'
                  : 'inset 0 -5px 0 rgba(0,0,0,0.18)',
                fontSize: '1.5rem',
                lineHeight: 1,
                animation: reachable ? 'pulse 1.6s infinite' : 'none',
              }}
            >
              {showCrack ? '⚡' : ''}
            </button>
          );
        }))}

        {/* Betty the climber */}
        {pos.col != null && (
          <div style={{
            position: 'absolute',
            top: paneH - 90 - (pos.row + 1) * ROW_H - 34,
            left: `calc(${(pos.col + 0.5) * (100 / COLS)}% - 24px)`,
            fontSize: '2.4rem',
            lineHeight: 1,
            transition: 'top 0.45s ease, left 0.45s ease',
            pointerEvents: 'none',
            filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.25))',
            zIndex: 5,
          }}>
            🧗
          </div>
        )}

        {/* Ground */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 26,
          background: 'repeating-linear-gradient(90deg, #7A8B5E 0 30px, #6B7C52 30px 60px)',
        }} />
      </div>

      {phase === 'study' ? (
        <button className="primary big" style={{ width: '100%', maxWidth: 460 }} onClick={() => setPhase('climb')}>
          Got it — start climbing!
        </button>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontWeight: 700, minHeight: '1.5em', fontSize: '1rem' }}>
          {hint || `Height: ${rowsClimbed} of ${totalMoves} ledges`}
        </p>
      )}

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function ETClimb({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="ET Climb"
      icon="🧗"
      category="memory"
      level={level}
      instructions={[
        { icon: '🔍', text: 'Study the climbing wall — cracked holds are marked in red with a ⚡.' },
        { icon: '🙈', text: 'Then the cracks hide! Remember where they were.' },
        { icon: '🧗', text: 'Tap holds just above you to climb. Reach ET 👽 at the top of 2 walls — you have 2 grips.' },
      ]}
      tip="Trace your route out loud while the cracks are showing: “up, left, up…”"
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const COLS = 6;
const ROWS = 4;
const TOTAL_BRICKS = COLS * ROWS;
const BRICK_H = 34;
const BRICK_GAP = 6;
const BALL_R = 15;
const PADDLE_H = 26;
const PANE_H = 420;
const PADDLE_Y = PANE_H - 48;
const MAX_LIVES = 3;

// Row colors: dark saturated tokens that read on the light pane
const ROW_COLORS = ['#BE185D', '#B45309', '#047857', '#1D4ED8'];

const POINTS_PER_BRICK = 40;
const CLEAR_BONUS = 240;

function settingsFor(level) {
  return {
    ballSpeed: [0, 220, 260, 300, 340, 380][Math.min(level, 5)],
    paddleFrac: [0, 0.38, 0.34, 0.30, 0.27, 0.24][Math.min(level, 5)],
  };
}

function Playfield({ level, finishGame }) {
  const { ballSpeed, paddleFrac } = settingsFor(level);
  const paneRef = useRef(null);
  const { feedback, showFeedback } = useFeedback(1100);

  // All simulation state lives in refs; one snapshot per frame drives render
  const sim = useRef(null);
  const endedRef = useRef(false);
  const heldRef = useRef(0);
  const finishRef = useRef(finishGame);
  finishRef.current = finishGame;
  const feedbackRef = useRef(showFeedback);
  feedbackRef.current = showFeedback;

  const [view, setView] = useState(null);
  const [brickLayout, setBrickLayout] = useState(null);

  const endGame = useCallback((finalScore, broken) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setTimeout(() => finishRef.current({
      score: finalScore,
      correct: broken,
      total: TOTAL_BRICKS,
      isPerfect: broken === TOTAL_BRICKS,
    }), 1300);
  }, []);

  useEffect(() => {
    const pane = paneRef.current;
    const W = pane.clientWidth;
    const paddleW = Math.round(W * paddleFrac);
    const brickW = (W - BRICK_GAP * (COLS + 1)) / COLS;

    sim.current = {
      W,
      paddleW,
      paddleX: (W - paddleW) / 2,
      ballX: W / 2,
      ballY: PADDLE_Y - BALL_R,
      vx: 0,
      vy: 0,
      serving: 1.4,          // seconds until the ball launches
      lives: MAX_LIVES,
      score: 0,
      broken: 0,
      bricks: Array.from({ length: TOTAL_BRICKS }, (_, i) => ({
        x: BRICK_GAP + (i % COLS) * (brickW + BRICK_GAP),
        y: 56 + Math.floor(i / COLS) * (BRICK_H + BRICK_GAP),
        w: brickW,
        h: BRICK_H,
        row: Math.floor(i / COLS),
        alive: true,
      })),
    };
    setBrickLayout(sim.current.bricks.map(({ x, y, w, h, row }) => ({ x, y, w, h, row })));

    const launch = (s) => {
      const angle = (Math.random() * 60 - 30) * (Math.PI / 180);
      s.vx = ballSpeed * Math.sin(angle);
      s.vy = -ballSpeed * Math.cos(angle);
    };

    const step = (dt) => {
      const s = sim.current;
      if (!s || endedRef.current) return;

      // Paddle: held buttons / arrow keys
      if (heldRef.current !== 0) {
        s.paddleX = Math.max(0, Math.min(s.W - s.paddleW, s.paddleX + heldRef.current * 460 * dt));
      }

      if (s.serving > 0) {
        s.serving -= dt;
        s.ballX = s.paddleX + s.paddleW / 2;
        s.ballY = PADDLE_Y - BALL_R;
        if (s.serving <= 0) launch(s);
        return;
      }

      s.ballX += s.vx * dt;
      s.ballY += s.vy * dt;

      // Walls
      if (s.ballX < BALL_R) { s.ballX = BALL_R; s.vx = Math.abs(s.vx); }
      if (s.ballX > s.W - BALL_R) { s.ballX = s.W - BALL_R; s.vx = -Math.abs(s.vx); }
      if (s.ballY < BALL_R) { s.ballY = BALL_R; s.vy = Math.abs(s.vy); }

      // Paddle bounce — exit angle follows where the ball lands on the paddle
      if (s.vy > 0 && s.ballY + BALL_R >= PADDLE_Y && s.ballY + BALL_R <= PADDLE_Y + PADDLE_H + 14 &&
          s.ballX >= s.paddleX - BALL_R && s.ballX <= s.paddleX + s.paddleW + BALL_R) {
        const hit = Math.max(-1, Math.min(1, ((s.ballX - s.paddleX) / s.paddleW) * 2 - 1));
        // Small jitter so a dead-center hit can't lock into a vertical loop
        const angle = hit * (Math.PI / 3) + (Math.random() - 0.5) * 0.12; // up to ~60°
        s.vx = ballSpeed * Math.sin(angle);
        s.vy = -ballSpeed * Math.cos(angle);
        s.ballY = PADDLE_Y - BALL_R;
      }

      // Bricks
      for (const b of s.bricks) {
        if (!b.alive) continue;
        if (s.ballX + BALL_R > b.x && s.ballX - BALL_R < b.x + b.w &&
            s.ballY + BALL_R > b.y && s.ballY - BALL_R < b.y + b.h) {
          b.alive = false;
          s.broken += 1;
          s.score += POINTS_PER_BRICK;
          const overlapX = Math.min(s.ballX + BALL_R - b.x, b.x + b.w - (s.ballX - BALL_R));
          const overlapY = Math.min(s.ballY + BALL_R - b.y, b.y + b.h - (s.ballY - BALL_R));
          if (overlapX < overlapY) s.vx = -s.vx; else s.vy = -s.vy;
          if (s.broken === TOTAL_BRICKS) {
            s.score += CLEAR_BONUS;
            feedbackRef.current('correct', 'You cleared every brick!');
            endGame(s.score, s.broken);
          }
          break;
        }
      }

      // Ball lost off the bottom
      if (s.ballY - BALL_R > PANE_H) {
        s.lives -= 1;
        if (s.lives <= 0) {
          feedbackRef.current('wrong', `Out of balls — you broke ${s.broken} bricks!`);
          endGame(s.score, s.broken);
        } else {
          feedbackRef.current('wrong', `Ball lost — ${s.lives} left. Get ready!`);
          s.serving = 1.6;
        }
      }
    };

    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      const s = sim.current;
      setView({
        ballX: s.ballX, ballY: s.ballY,
        paddleX: s.paddleX, paddleW: s.paddleW,
        lives: s.lives, score: s.score, broken: s.broken,
        serving: s.serving > 0,
        bricks: s.bricks.map(b => b.alive),
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e) => {
      if (e.type === 'keydown') {
        if (e.key === 'ArrowLeft') { heldRef.current = -1; e.preventDefault(); }
        if (e.key === 'ArrowRight') { heldRef.current = 1; e.preventDefault(); }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        heldRef.current = 0;
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [ballSpeed, paddleFrac, endGame]);

  // Slide a finger (or the mouse) anywhere on the board to steer the paddle
  const steerToPointer = (e) => {
    const s = sim.current;
    if (!s) return;
    const rect = paneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    s.paddleX = Math.max(0, Math.min(s.W - s.paddleW, x - s.paddleW / 2));
  };

  const holdBtn = (dir, label, symbol) => (
    <button
      className="choice-btn"
      style={{ flex: 1, fontSize: '1.4rem', touchAction: 'none' }}
      onPointerDown={(e) => { e.preventDefault(); heldRef.current = dir; }}
      onPointerUp={() => { heldRef.current = 0; }}
      onPointerLeave={() => { heldRef.current = 0; }}
      onPointerCancel={() => { heldRef.current = 0; }}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={label}
    >
      {symbol} {label}
    </button>
  );

  return (
    <>
      <GameHUD
        score={view?.score ?? 0}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Bricks</span>
              <span className="hud-value">{view?.broken ?? 0} of {TOTAL_BRICKS}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Balls</span>
              <span className="hud-value">
                {Array.from({ length: MAX_LIVES }, (_, i) => (i < (view?.lives ?? MAX_LIVES) ? '🔴' : '⚪')).join(' ')}
              </span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Slide your finger on the board to move the paddle!
      </p>

      <div
        ref={paneRef}
        onPointerDown={steerToPointer}
        onPointerMove={steerToPointer}
        style={{
          width: '100%',
          maxWidth: 640,
          height: PANE_H,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #FFF9EF 0%, #F3EADB 100%)',
          border: '3px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          touchAction: 'none',
          cursor: 'pointer',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        {view && brickLayout && brickLayout.map((b, i) => view.bricks[i] && (
          <div key={i} style={{
            position: 'absolute',
            left: b.x, top: b.y, width: b.w, height: b.h,
            backgroundColor: ROW_COLORS[b.row],
            borderRadius: 8,
            boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)',
          }} />
        ))}
        {view && (
          <>
            <div style={{
              position: 'absolute',
              left: view.ballX - BALL_R, top: view.ballY - BALL_R,
              width: BALL_R * 2, height: BALL_R * 2,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 32% 30%, #F87171, #B91C1C)',
              boxShadow: 'var(--shadow-sm)',
              opacity: view.serving ? 0.85 : 1,
            }} />
            <div style={{
              position: 'absolute',
              left: view.paddleX, top: PADDLE_Y,
              width: view.paddleW, height: PADDLE_H,
              backgroundColor: 'var(--cat-memory)',
              borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-sm)',
            }} />
            {view.serving && (
              <div style={{
                position: 'absolute', left: 0, right: 0, top: '46%',
                textAlign: 'center', fontWeight: 700, fontSize: '1.3rem',
                color: 'var(--text-secondary)',
              }}>
                Get ready…
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', width: '100%', maxWidth: 640 }}>
        {holdBtn(-1, 'LEFT', '◀')}
        {holdBtn(1, 'RIGHT', '▶')}
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function Breakout({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Betty Breakout"
      icon="🏓"
      category="speed"
      level={level}
      instructions={[
        { icon: '🏓', text: 'Bounce the ball off your paddle to break the colorful bricks.' },
        { icon: '👆', text: 'Slide your finger on the board (or hold LEFT / RIGHT) to move the paddle.' },
        { icon: '🔴', text: 'You have 3 balls — break all the bricks to win!' },
      ]}
      tip="Watch the ball, not the paddle — your hand will follow your eyes."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

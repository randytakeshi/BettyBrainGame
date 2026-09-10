import React, { useState, useRef, useEffect } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const TOTAL_FRAMES = 5;
const TOTAL_PINS = TOTAL_FRAMES * 10;
const PANE_H = 470;
const PIN_AREA_TOP = 64;      // where the head pin row sits
const BALL_START_Y = PANE_H - 70;
const POINTS_PER_PIN = 10;
const STRIKE_BONUS = 50;
const SPARE_BONUS = 25;

// Pin rack (fractions of lane width, back row first). Row 0 = back four.
const PIN_SPOTS = [
  { x: 0.32, row: 0 }, { x: 0.44, row: 0 }, { x: 0.56, row: 0 }, { x: 0.68, row: 0 },
  { x: 0.38, row: 1 }, { x: 0.50, row: 1 }, { x: 0.62, row: 1 },
  { x: 0.44, row: 2 }, { x: 0.56, row: 2 },
  { x: 0.50, row: 3 },
];

function settingsFor(level) {
  const l = Math.min(level, 5);
  return {
    sweepSpeed: [0, 1.5, 1.9, 2.3, 2.7, 3.1][l],   // radians/sec of the aim pendulum
    sweetSpot: [0, 0.05, 0.045, 0.04, 0.038, 0.035][l], // strike zone half-width
  };
}

// How many pins a roll knocks down, from how far the aim was off center
function pinsForOffset(offset, sweetSpot, standingCount) {
  if (offset <= sweetSpot) return standingCount;              // strike / spare
  if (offset <= sweetSpot + 0.05) return Math.min(standingCount, 8 + Math.round(Math.random()));
  if (offset <= sweetSpot + 0.11) return Math.min(standingCount, 6 + Math.round(Math.random()));
  if (offset <= sweetSpot + 0.18) return Math.min(standingCount, 4 + Math.round(Math.random()));
  if (offset <= sweetSpot + 0.26) return Math.min(standingCount, 2 + Math.round(Math.random()));
  if (offset <= 0.34) return Math.min(standingCount, 1);
  return 0;                                                    // gutter!
}

function Playfield({ level, finishGame }) {
  const { sweepSpeed, sweetSpot } = settingsFor(level);
  const { feedback, showFeedback } = useFeedback(1150);

  const S = useRef(null);
  const timersRef = useRef([]);
  const endedRef = useRef(false);
  const finishRef = useRef(finishGame);
  finishRef.current = finishGame;

  const [view, setView] = useState(null);

  useEffect(() => {
    S.current = {
      frame: 1,
      roll: 1,
      score: 0,
      pinsTotal: 0,
      standing: Array(10).fill(true),
      frameCard: [],          // per frame: 'X', '7 /', '5 2', …
      frameFirstRoll: 0,
      phase: 'aim',           // 'aim' | 'rolling' | 'settle'
      marker: 0.5,
      ball: null,             // { x } while rolling
      t: 0,
    };
    const s = S.current;
    const later = (fn, ms) => { timersRef.current.push(setTimeout(fn, ms)); };

    const publish = () => setView({
      frame: s.frame,
      roll: s.roll,
      score: s.score,
      pinsTotal: s.pinsTotal,
      standing: [...s.standing],
      frameCard: [...s.frameCard],
      phase: s.phase,
      marker: s.marker,
      ball: s.ball ? { ...s.ball } : null,
    });

    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (s.phase === 'aim') {
        s.t += dt;
        s.marker = 0.5 + 0.34 * Math.sin(s.t * sweepSpeed);
      }
      publish();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const endGame = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      later(() => finishRef.current({
        score: s.score,
        correct: s.pinsTotal,
        total: TOTAL_PINS,
        isPerfect: s.pinsTotal === TOTAL_PINS,
      }), 1300);
    };

    const knockPins = (aimX, count) => {
      // The `count` standing pins nearest the ball's line fall over
      const order = s.standing
        .map((up, i) => ({ i, up, d: Math.abs(PIN_SPOTS[i].x - aimX) + PIN_SPOTS[i].row * 0.012 }))
        .filter(p => p.up)
        .sort((a, b) => a.d - b.d)
        .slice(0, count);
      order.forEach(p => { s.standing[p.i] = false; });
    };

    s.rollBall = () => {
      if (s.phase !== 'aim' || endedRef.current) return;
      const aimX = s.marker;
      s.phase = 'rolling';
      s.ball = { x: aimX };
      publish();

      later(() => {
        const offset = Math.abs(aimX - 0.5);
        const standingCount = s.standing.filter(Boolean).length;
        const knocked = pinsForOffset(offset, sweetSpot, standingCount);
        knockPins(aimX, knocked);
        s.pinsTotal += knocked;
        s.phase = 'settle';
        s.ball = null;

        const isStrike = s.roll === 1 && knocked === 10;
        const isSpare = s.roll === 2 && knocked === standingCount && knocked > 0;
        let pts = knocked * POINTS_PER_PIN;

        if (isStrike) {
          pts += STRIKE_BONUS;
          s.frameCard.push('💥 X');
          showFeedback('correct', `STRIKE! All 10 pins! +${pts}`);
        } else if (isSpare) {
          pts += SPARE_BONUS;
          s.frameCard.push(`${s.frameFirstRoll} /`);
          showFeedback('correct', `SPARE! Picked up the rest! +${pts}`);
        } else if (s.roll === 2) {
          s.frameCard.push(`${s.frameFirstRoll} ${knocked}`);
          showFeedback(knocked > 0 ? 'correct' : 'wrong',
            knocked > 0 ? `${knocked} more pin${knocked > 1 ? 's' : ''}! +${pts}` : 'Gutter ball — happens to the best of us!');
        } else {
          s.frameFirstRoll = knocked;
          showFeedback(knocked >= 6 ? 'correct' : knocked > 0 ? 'correct' : 'wrong',
            knocked > 0 ? `${knocked} pin${knocked > 1 ? 's' : ''} down! +${pts}` : 'Gutter ball — line it up again!');
        }
        s.score += pts;
        publish();

        later(() => {
          if (isStrike || s.roll === 2) {
            // Frame over — fresh rack or the end of the game
            if (s.frame >= TOTAL_FRAMES) { publish(); endGame(); return; }
            s.frame += 1;
            s.roll = 1;
            s.frameFirstRoll = 0;
            s.standing = Array(10).fill(true);
          } else {
            s.roll = 2;
          }
          s.phase = 'aim';
          publish();
        }, 1400);
      }, 950);
    };

    publish();
    const timers = timersRef.current;
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [level, sweepSpeed, sweetSpot, showFeedback]);

  const v = view;
  if (!v) return null;

  // Lane geometry: perspective trapezoid — narrow at the pins, wide at Betty
  const laneX = (frac, y) => {
    const topInset = 18, bottomInset = 4; // % insets at top vs bottom
    const inset = topInset + (bottomInset - topInset) * (y / PANE_H);
    return `calc(${inset}% + ${frac * 100}% * ${(100 - 2 * inset) / 100})`;
  };

  return (
    <>
      <GameHUD
        score={v.score}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Frame</span>
              <span className="hud-value">{v.frame} of {TOTAL_FRAMES}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Roll</span>
              <span className="hud-value">{v.roll === 1 ? '1st' : '2nd'}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Pins</span>
              <span className="hud-value" style={{ color: 'var(--cat-memory)' }}>{v.pinsTotal}</span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Tap ROLL when the arrow points at the middle pin!
      </p>

      {/* The lane */}
      <div style={{
        width: '100%',
        maxWidth: 560,
        height: PANE_H,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #6B4A2B 0%, #8B6337 12%, #C89B62 30%, #E0B87E 100%)',
        border: '3px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--spacing-sm)',
        userSelect: 'none',
      }}>
        {/* Gutters */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '9%', background: 'linear-gradient(90deg, #3A2A18, #55402A)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '9%', background: 'linear-gradient(270deg, #3A2A18, #55402A)', pointerEvents: 'none' }} />

        {/* Lane arrows */}
        {[0.35, 0.5, 0.65].map((f, i) => (
          <div key={i} style={{
            position: 'absolute', top: 250 + (i === 1 ? -18 : 0), left: laneX(f, 250),
            transform: 'translateX(-50%)', color: '#8B6337', fontSize: '1.1rem', pointerEvents: 'none',
          }}>▲</div>
        ))}

        {/* Pins */}
        {PIN_SPOTS.map((p, i) => {
          const y = PIN_AREA_TOP + p.row * 26;
          return (
            <div key={i} style={{
              position: 'absolute',
              top: y,
              left: laneX(p.x, y),
              transform: v.standing[i] ? 'translateX(-50%)' : 'translateX(-50%) rotate(78deg) translateY(6px)',
              opacity: v.standing[i] ? 1 : 0.25,
              transition: 'transform 0.35s ease, opacity 0.5s ease',
              pointerEvents: 'none',
              width: 22,
              height: 44,
              zIndex: 4 - p.row,
            }}>
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 55%, #F1F1F1 100%)',
                borderRadius: '46% 46% 40% 40% / 30% 30% 62% 62%',
                border: '1.5px solid #B9AFa2',
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 5, backgroundColor: '#DC2626' }} />
              </div>
            </div>
          );
        })}

        {/* The ball */}
        <div style={{
          position: 'absolute',
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 32% 28%, #7C3AED, #3B0764)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.35)',
          left: laneX(v.ball ? v.ball.x : v.marker, v.ball ? PIN_AREA_TOP + 40 : BALL_START_Y),
          top: v.phase === 'rolling' ? PIN_AREA_TOP + 40 : BALL_START_Y,
          transform: 'translateX(-50%)',
          transition: v.phase === 'rolling' ? 'top 0.9s ease-in, left 0.9s linear' : 'none',
          pointerEvents: 'none',
          zIndex: 5,
        }} />

        {/* Aim arrow, sweeping at the foul line */}
        {v.phase === 'aim' && (
          <div
            data-marker={v.marker.toFixed(3)}
            style={{
              position: 'absolute',
              top: BALL_START_Y - 42,
              left: laneX(v.marker, BALL_START_Y - 42),
              transform: 'translateX(-50%)',
              fontSize: '2rem',
              color: 'var(--error)',
              textShadow: '0 2px 3px rgba(0,0,0,0.3)',
              pointerEvents: 'none',
              lineHeight: 1,
              zIndex: 6,
            }}
          >
            ⬆
          </div>
        )}
      </div>

      {/* Frame scorecard */}
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 560, marginBottom: 'var(--spacing-sm)' }}>
        {Array.from({ length: TOTAL_FRAMES }, (_, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: 'center',
            backgroundColor: i + 1 === v.frame && v.frameCard.length < TOTAL_FRAMES ? 'var(--brand-soft)' : 'var(--surface-color)',
            border: `2px solid ${i + 1 === v.frame && v.frameCard.length < TOTAL_FRAMES ? 'var(--brand)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '6px 2px',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>F{i + 1}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, minHeight: '1.4em' }}>{v.frameCard[i] || '–'}</div>
          </div>
        ))}
      </div>

      <button
        className="primary big"
        onPointerDown={() => S.current?.rollBall()}
        disabled={v.phase !== 'aim'}
        style={{ width: '100%', maxWidth: 560, minHeight: 100, fontSize: '1.6rem' }}
      >
        🎳 ROLL!
      </button>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function BettyBowling({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Betty Bowling"
      icon="🎳"
      category="speed"
      level={level}
      instructions={[
        { icon: '🎯', text: 'The red arrow sweeps back and forth across the lane.' },
        { icon: '👆', text: 'Tap ROLL exactly when the arrow points at the middle pin.' },
        { icon: '💥', text: '5 frames, 2 rolls each. All 10 pins on the first roll is a STRIKE for bonus points!' },
      ]}
      tip="Watch the arrow make a full sweep or two first — feel the rhythm, then roll."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

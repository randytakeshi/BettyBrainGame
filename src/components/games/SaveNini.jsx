import React, { useState, useRef, useEffect } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const TOTAL_WAVES = 5;
const PANE_H = 440;
const FLY_SIZE = 62;
const POINTS_PER_FLY = 60;
const WAVE_BONUS = 100;

function settingsFor(level) {
  const l = Math.min(level, 5);
  return {
    waveSizes: l >= 4 ? [2, 2, 3, 3, 4] : [1, 2, 2, 3, 3],
    flySpeed: [0, 70, 85, 100, 115, 130][l],       // px per second
    drainPerFly: [0, 3.5, 4, 4.5, 5, 5.5][l],      // courage % per second, per fly
  };
}

function courageColor(c) {
  if (c > 60) return 'var(--success)';
  if (c > 30) return 'var(--gold-bright)';
  return 'var(--error)';
}

function Playfield({ level, finishGame }) {
  const { feedback, showFeedback } = useFeedback(1150);

  const paneRef = useRef(null);
  const sim = useRef(null);
  const endedRef = useRef(false);
  const timersRef = useRef([]);
  const finishRef = useRef(finishGame);
  finishRef.current = finishGame;

  const [view, setView] = useState(null);
  const [swats, setSwats] = useState([]); // splat markers {x, y, id}

  useEffect(() => {
    // Looked up inside the effect: settingsFor returns fresh objects, and an
    // array in the dep list would re-run (and reset) the game every render.
    const { waveSizes, flySpeed, drainPerFly } = settingsFor(level);
    const W = paneRef.current.clientWidth;
    sim.current = {
      W,
      flies: [],
      courage: 100,
      wave: 0,
      cleared: 0,
      streak: 0,
      bestStreak: 0,
      score: 0,
      phase: 'interlude', // 'active' | 'interlude' | 'hiding'
      nextFlyId: 1,
    };
    const s = sim.current;

    const later = (fn, ms) => { timersRef.current.push(setTimeout(fn, ms)); };

    const startWave = () => {
      if (endedRef.current) return;
      s.wave += 1;
      s.flies = [];
      s.phase = 'active';
      const count = waveSizes[s.wave - 1];
      s.waveTotal = count;
      s.spawned = 0;
      for (let i = 0; i < count; i++) {
        // Staggered arrivals so a swarm doesn't materialize all at once
        later(() => {
          if (endedRef.current || s.phase !== 'active') return;
          s.spawned += 1;
          const angle = Math.random() * Math.PI * 2;
          s.flies.push({
            id: s.nextFlyId++,
            x: 60 + Math.random() * (W - 120),
            y: 50 + Math.random() * (PANE_H * 0.55),
            vx: Math.cos(angle) * flySpeed,
            vy: Math.sin(angle) * flySpeed,
            alive: true,
          });
        }, i * 450);
      }
    };

    const endGameSoon = () => {
      endedRef.current = true;
      later(() => finishRef.current({
        score: s.score,
        correct: s.cleared,
        total: TOTAL_WAVES,
        bestStreak: s.bestStreak,
        isPerfect: s.cleared === TOTAL_WAVES,
      }), 1400);
    };

    const advanceWave = () => {
      if (s.wave >= TOTAL_WAVES) { endGameSoon(); return; }
      s.phase = 'interlude';
      later(startWave, 1300);
    };

    s.handleWaveClear = () => {
      s.score += WAVE_BONUS;
      s.cleared += 1;
      s.streak += 1;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      s.courage = Math.min(100, s.courage + 35);
      s.phase = 'interlude';
      showFeedback('correct', s.streak >= 2 ? `${s.streak} rooms in a row fly-free!` : 'All flies gone — Nini relaxes! ❤️');
      advanceWave();
    };

    const handleNiniHides = () => {
      s.streak = 0;
      s.phase = 'hiding';
      s.flies = [];  // the flies win this round
      showFeedback('wrong', 'Nini hid in the closet! You coax her back out…');
      later(() => {
        s.courage = 65;
        advanceWave();
      }, 1500);
    };

    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (s.phase === 'active' && !endedRef.current) {
        const aliveCount = s.flies.filter(f => f.alive).length;
        if (aliveCount > 0) {
          s.courage = Math.max(0, s.courage - drainPerFly * aliveCount * dt);
          if (s.courage <= 0) handleNiniHides();
        }
        for (const f of s.flies) {
          if (!f.alive) continue;
          // Buzzy wandering: keep speed, nudge the heading a little each frame
          const turn = (Math.random() - 0.5) * 3 * dt;
          const cos = Math.cos(turn), sin = Math.sin(turn);
          [f.vx, f.vy] = [f.vx * cos - f.vy * sin, f.vx * sin + f.vy * cos];
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          if (f.x < 40) { f.x = 40; f.vx = Math.abs(f.vx); }
          if (f.x > s.W - 40) { f.x = s.W - 40; f.vx = -Math.abs(f.vx); }
          if (f.y < 40) { f.y = 40; f.vy = Math.abs(f.vy); }
          if (f.y > PANE_H - 120) { f.y = PANE_H - 120; f.vy = -Math.abs(f.vy); }
        }
      }

      setView({
        courage: s.courage,
        wave: Math.max(1, s.wave),
        cleared: s.cleared,
        score: s.score,
        streak: s.streak,
        phase: s.phase,
        flies: s.flies.filter(f => f.alive).map(f => ({ id: f.id, x: f.x, y: f.y })),
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    later(startWave, 900);

    const timers = timersRef.current;
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [level, showFeedback]);

  const swatFly = (id, e) => {
    const s = sim.current;
    if (!s || s.phase !== 'active' || endedRef.current) return;
    const fly = s.flies.find(f => f.id === id && f.alive);
    if (!fly) return;
    fly.alive = false;
    s.score += POINTS_PER_FLY;

    const splatId = Math.random();
    setSwats(sw => [...sw, { x: fly.x, y: fly.y, id: splatId }]);
    setTimeout(() => setSwats(sw => sw.filter(w => w.id !== splatId)), 600);
    e.stopPropagation();

    // Clear only when every fly of the wave has both arrived and been swatted
    if (s.spawned === s.waveTotal && !s.flies.some(f => f.alive)) s.handleWaveClear();
  };

  const scared = view && view.phase === 'active' && view.flies.length > 0;
  const nearPanic = scared && view.courage < 35;
  const hiding = view?.phase === 'hiding';

  return (
    <>
      <GameHUD
        score={view?.score ?? 0}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Room</span>
              <span className="hud-value">{view?.wave ?? 1} of {TOTAL_WAVES}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Saved</span>
              <span className="hud-value" style={{ color: 'var(--success)' }}>❤️ {view?.cleared ?? 0}</span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Swat the flies 🪰 before Nini's courage runs out!
      </p>

      <div
        ref={paneRef}
        style={{
          width: '100%',
          maxWidth: 640,
          height: PANE_H,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #F7EAD9 0%, #F2E2CC 72%, #C8A272 72%, #B98F5E 100%)',
          border: '3px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          touchAction: 'manipulation',
          marginBottom: 'var(--spacing-sm)',
          userSelect: 'none',
        }}
      >
        {/* Courage meter */}
        <div style={{ position: 'absolute', top: 10, left: 14, right: 14, zIndex: 6, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            <span>🦴 NINI'S COURAGE</span>
            <span>{Math.round(view?.courage ?? 100)}%</span>
          </div>
          <div style={{ height: 16, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 'var(--radius-full)', border: '2px solid var(--border-strong)', overflow: 'hidden' }}>
            <div style={{
              width: `${view?.courage ?? 100}%`,
              height: '100%',
              backgroundColor: courageColor(view?.courage ?? 100),
              transition: 'background-color 0.3s',
            }} />
          </div>
        </div>

        {/* Room dressing */}
        <div style={{ position: 'absolute', top: 64, left: 18, fontSize: '2rem', pointerEvents: 'none' }}>🪟</div>
        <div style={{ position: 'absolute', bottom: 34, left: '34%', fontSize: '2.4rem', pointerEvents: 'none' }}>🛋️</div>

        {/* The closet */}
        <div style={{
          position: 'absolute', right: 10, bottom: 30, width: 86, textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>🚪</div>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)',
            backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 'var(--radius-full)', padding: '0 8px', display: 'inline-block',
          }}>
            {hiding ? 'NINI IS IN HERE 🙈' : 'closet'}
          </div>
        </div>

        {/* Nini — she drifts toward the closet as her courage falls */}
        {!hiding && (
          <div
            className={scared ? 'shake' : ''}
            style={{
              position: 'absolute',
              bottom: 40,
              left: nearPanic ? '64%' : scared ? '48%' : '22%',
              width: 90,
              textAlign: 'center',
              transition: 'left 0.9s ease',
              pointerEvents: 'none',
              zIndex: 4,
              animationIterationCount: 'infinite',
            }}
          >
            <div style={{ fontSize: '1rem', lineHeight: 1.2, minHeight: 22 }}>
              {view?.phase === 'interlude' && view?.cleared > 0 ? '❤️' : nearPanic ? '💨' : scared ? '😰' : ''}
            </div>
            <div style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>🐶</div>
            <div style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#FFF',
              background: 'linear-gradient(90deg, #1F2430 50%, #6B7280 50%)',
              borderRadius: 'var(--radius-full)', display: 'inline-block', padding: '0 10px',
            }}>
              Nini
            </div>
          </div>
        )}

        {/* Flies */}
        {view?.flies.map(f => (
          <button
            key={f.id}
            className="compact"
            onPointerDown={(e) => swatFly(f.id, e)}
            aria-label="Fly — tap to swat"
            style={{
              position: 'absolute',
              left: f.x - FLY_SIZE / 2,
              top: f.y - FLY_SIZE / 2,
              width: FLY_SIZE,
              height: FLY_SIZE,
              minHeight: FLY_SIZE,
              padding: 0,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.55)',
              border: '2px dashed var(--border-strong)',
              fontSize: '1.7rem',
              lineHeight: 1,
              zIndex: 5,
            }}
          >
            🪰
          </button>
        ))}

        {/* Swat splats */}
        {swats.map(w => (
          <div key={w.id} className="pop-in" style={{
            position: 'absolute', left: w.x - 24, top: w.y - 24,
            fontSize: '2.2rem', pointerEvents: 'none', zIndex: 6,
          }}>
            💥
          </div>
        ))}
      </div>

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1rem', minHeight: '1.5em' }}>
        {hiding
          ? 'Coaxing Nini out of the closet…'
          : nearPanic
            ? '⚠️ Nini is edging toward the closet — hurry!'
            : view?.phase === 'interlude'
              ? 'Nini relaxes… but here come more flies!'
              : ' '}
      </p>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function SaveNini({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Save Nini"
      icon="🐶"
      category="attention"
      level={level}
      instructions={[
        { icon: '🐶', text: 'Nini, the black-and-white long-haired Chihuahua, is TERRIFIED of flies — one buzz and she hides in the closet!' },
        { icon: '🪰', text: 'Flies sneak into the room. Tap each one to swat it.' },
        { icon: '🦴', text: 'Flies drain Nini\'s courage — clear all 5 rooms of flies before it runs out and keep her out of the closet!' },
      ]}
      tip="Swat the fly nearest Nini first — a calm dog is a brave dog."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

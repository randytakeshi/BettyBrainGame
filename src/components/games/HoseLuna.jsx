import React, { useState, useRef, useEffect } from 'react';
import { GameShell, GameHUD } from '../GameShell';
import { useTrialGame } from '../../hooks/useTrialGame';

const TOTAL_SPRAYS = 15;
const HIT_RADIUS = 78;          // generous — Luna is fluffy
const PANE_H = 440;
const PERFECT_AT = 13;          // soaks needed for a level-up

function settingsFor(level) {
  return {
    trotSpeed: [0, 70, 90, 110, 130, 150][Math.min(level, 5)],   // px per second
    pauseMs: [0, 1800, 1500, 1200, 1000, 800][Math.min(level, 5)], // average sniff-stop length
  };
}

const NOZZLE = { x: 30, y: PANE_H - 34 };

function Playfield({ level, finishGame }) {
  const { trotSpeed, pauseMs } = settingsFor(level);

  const game = useTrialGame({
    totalTrials: TOTAL_SPRAYS,
    feedbackMs: 550,
    finishGame: (res) => finishGame({ ...res, isPerfect: (res.correct ?? 0) >= PERFECT_AT }),
  });
  const gameRef = useRef(game);
  gameRef.current = game;

  const paneRef = useRef(null);
  const luna = useRef({ x: 200, y: 200, tx: 200, ty: 200, pauseUntil: 0, soakedUntil: 0, facing: 1 });
  const [view, setView] = useState(null);
  const [spray, setSpray] = useState(null); // { x, y, hit, id }

  useEffect(() => {
    const W = paneRef.current.clientWidth;
    const l = luna.current;
    l.x = W / 2; l.y = PANE_H / 2;
    l.tx = l.x; l.ty = l.y;
    l.pauseUntil = performance.now() + 1200;

    const pickTarget = (now, skipSniff) => {
      l.tx = 50 + Math.random() * (W - 100);
      l.ty = 70 + Math.random() * (PANE_H - 170);
      // Sometimes Luna stops to sniff before setting off again
      if (!skipSniff && Math.random() < 0.5) l.pauseUntil = now + pauseMs * (0.6 + Math.random() * 0.9);
    };

    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const soaked = now < l.soakedUntil;
      if (l.wasSoaked && !soaked) {
        // Zoomies! She shakes off and dashes somewhere new — no camping one spot
        pickTarget(now, true);
        l.pauseUntil = 0;
        l.zoomiesUntil = now + 1300;
      }
      l.wasSoaked = soaked;

      if (!soaked && now >= l.pauseUntil) {
        const speed = trotSpeed * (now < (l.zoomiesUntil || 0) ? 1.9 : 1);
        const dx = l.tx - l.x;
        const dy = l.ty - l.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          pickTarget(now);
        } else {
          l.x += (dx / dist) * speed * dt;
          l.y += (dy / dist) * speed * dt;
          if (Math.abs(dx) > 4) l.facing = dx > 0 ? 1 : -1;
        }
      }
      setView({
        x: l.x, y: l.y, facing: l.facing, soaked,
        sniffing: !soaked && now < l.pauseUntil,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trotSpeed, pauseMs]);

  const handleSpray = (e) => {
    const g = gameRef.current;
    if (g.locked || g.trial > TOTAL_SPRAYS) return;
    const rect = paneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const l = luna.current;
    const hit = Math.hypot(x - l.x, y - l.y) <= HIT_RADIUS;
    if (hit) l.soakedUntil = performance.now() + 900;

    setSpray({ x, y, hit, id: Math.random() });
    setTimeout(() => setSpray(null), 450);
    g.answer(hit);
  };

  const streamAngle = spray
    ? Math.atan2(spray.y - NOZZLE.y, spray.x - NOZZLE.x) * (180 / Math.PI)
    : 0;
  const streamLen = spray
    ? Math.hypot(spray.x - NOZZLE.x, spray.y - NOZZLE.y)
    : 0;

  return (
    <>
      <GameHUD
        score={game.score}
        streak={game.streak}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Sprays</span>
              <span className="hud-value">{Math.max(0, TOTAL_SPRAYS - game.trial + 1)} left</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Soaks</span>
              <span className="hud-value" style={{ color: 'var(--cat-memory)' }}>💦 {game.correct}</span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Tap the yard to spray — soak Luna, she loves it!
      </p>

      <div
        ref={paneRef}
        onPointerDown={handleSpray}
        style={{
          width: '100%',
          maxWidth: 640,
          height: PANE_H,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #D8EEFB 0%, #C9E8C4 30%, #A9D89E 100%)',
          border: '3px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          touchAction: 'manipulation',
          cursor: 'crosshair',
          marginBottom: 'var(--spacing-sm)',
          userSelect: 'none',
        }}
      >
        {/* Backyard dressing */}
        <div style={{ position: 'absolute', top: 10, right: 16, fontSize: '2rem', pointerEvents: 'none' }}>☀️</div>
        <div style={{ position: 'absolute', bottom: 42, right: 20, fontSize: '1.5rem', pointerEvents: 'none' }}>🌼🌷</div>
        <div style={{ position: 'absolute', top: 64, left: 16, fontSize: '1.5rem', pointerEvents: 'none' }}>🌳</div>

        {/* Water stream + splash */}
        {spray && (
          <>
            <div key={spray.id} style={{
              position: 'absolute',
              left: NOZZLE.x,
              top: NOZZLE.y,
              width: streamLen,
              height: 7,
              borderRadius: 4,
              background: 'linear-gradient(90deg, rgba(37,99,235,0.9), rgba(96,165,250,0.75))',
              transform: `rotate(${streamAngle}deg)`,
              transformOrigin: 'left center',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              left: spray.x - 22,
              top: spray.y - 22,
              fontSize: '2rem',
              pointerEvents: 'none',
            }} className="pop-in">
              💦
            </div>
          </>
        )}

        {/* Luna */}
        {view && (
          <div style={{
            position: 'absolute',
            left: view.x - 40,
            top: view.y - 44,
            width: 80,
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 4,
          }}>
            <div style={{ fontSize: '1.1rem', lineHeight: 1, minHeight: 20 }}>
              {view.soaked ? '💦❤️💦' : view.sniffing ? '👃' : ''}
            </div>
            <div style={{
              fontSize: '2.8rem',
              lineHeight: 1.1,
              transform: `scaleX(${view.facing === 1 ? -1 : 1})`,
              animation: view.soaked ? 'pulse 0.4s infinite' : 'none',
            }}>
              🐕
            </div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#3B4A2F',
              backgroundColor: 'rgba(255,255,255,0.75)',
              borderRadius: 'var(--radius-full)',
              display: 'inline-block',
              padding: '0 10px',
            }}>
              {view.soaked ? 'WOOF!' : 'Luna'}
            </div>
          </div>
        )}

        {/* The hose */}
        <div style={{ position: 'absolute', left: 4, bottom: 2, fontSize: '2rem', pointerEvents: 'none' }}>
          🚿
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1rem', minHeight: '1.5em' }}>
        {view?.sniffing ? 'Luna stopped to sniff — now’s your chance!' : ' '}
      </p>
    </>
  );
}

export function HoseLuna({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Hose Luna"
      icon="🐕"
      category="speed"
      level={level}
      instructions={[
        { icon: '🐕', text: 'Luna the Australian Shepherd LOVES being sprayed by the hose!' },
        { icon: '👆', text: 'Tap anywhere in the yard to spray water at that spot.' },
        { icon: '💦', text: 'You have 15 sprays — soak Luna as many times as you can. Every splash makes her happy!' },
      ]}
      tip="Luna often stops to sniff the flowers — that's the moment to spray!"
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

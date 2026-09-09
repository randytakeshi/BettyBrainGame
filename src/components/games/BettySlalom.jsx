import React, { useState, useEffect, useRef } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';
import './BettySlalom.css';

const RUN_SECONDS = 40;
const MAX_COLLISIONS = 3;
const POINTS_PER_SECOND = 25;
const CLEAN_RUN_BONUS = 200;

function Playfield({ level, finishGame }) {
  const [lane, setLane] = useState(1); // 0: Left, 1: Center, 2: Right
  const [view, setView] = useState({ obstacles: [], seconds: 0, collisions: 0, crashed: false });
  const [ended, setEnded] = useState(false);
  const { feedback, showFeedback } = useFeedback(1100);

  // All mutable game state lives in refs so the single rAF chain never has
  // to re-subscribe; setView publishes a render snapshot once per frame.
  const laneRef = useRef(1);
  const endedRef = useRef(false);
  const rafRef = useRef(null);
  const endTimeoutRef = useRef(null);
  const worldRef = useRef({
    obstacles: [],
    startTime: null,
    lastTime: null,
    lastSpawn: 0,
    collisions: 0,
    invulnUntil: 0,
    crashUntil: 0,
  });

  // Gentle pacing: trees drift up 28% of the slope per second at level 1,
  // up to 56%/s at level 5, spawning every 1.8s down to 1.1s.
  const speed = 28 + (Math.min(level, 5) - 1) * 7;
  const spawnInterval = Math.max(1100, 1800 - (Math.min(level, 5) - 1) * 175);

  const moveLane = (delta) => {
    if (endedRef.current) return;
    const next = Math.max(0, Math.min(2, laneRef.current + delta));
    laneRef.current = next;
    setLane(next);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); moveLane(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); moveLane(1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const step = (time) => {
      const w = worldRef.current;
      if (w.startTime === null) {
        w.startTime = time;
        w.lastTime = time;
        w.lastSpawn = time;
      }
      const dt = Math.min(0.05, (time - w.lastTime) / 1000);
      w.lastTime = time;
      const elapsed = (time - w.startTime) / 1000;

      // Spawn 1 or 2 trees (never 3 — a path always stays open), and stop
      // spawning near the finish so the run ends on open snow.
      if (time - w.lastSpawn > spawnInterval && elapsed < RUN_SECONDS - 2) {
        w.lastSpawn = time;
        const numTrees = Math.random() > 0.8 && level > 1 ? 2 : 1;
        const availableLanes = [0, 1, 2];
        for (let i = 0; i < numTrees; i++) {
          const laneIndex = Math.floor(Math.random() * availableLanes.length);
          const treeLane = availableLanes.splice(laneIndex, 1)[0];
          w.obstacles.push({ id: `${time}-${i}`, lane: treeLane, bottom: -12 });
        }
      }

      // Move trees and check for a bump (skier sits at ~bottom 80%).
      let bumped = false;
      w.obstacles = w.obstacles.filter(obs => {
        obs.bottom += speed * dt;
        if (
          !bumped &&
          time > w.invulnUntil &&
          obs.lane === laneRef.current &&
          obs.bottom > 68 && obs.bottom < 86
        ) {
          bumped = true;
          return false; // the bumped tree is cleared away
        }
        return obs.bottom < 115;
      });

      if (bumped) {
        w.collisions += 1;
        w.invulnUntil = time + 1200;
        w.crashUntil = time + 900;
        const left = MAX_COLLISIONS - w.collisions;
        if (left > 0) {
          showFeedback('wrong', `Oof — a tree! ${left} ${left === 1 ? 'chance' : 'chances'} left`);
        }
      }

      const seconds = Math.min(RUN_SECONDS, Math.floor(elapsed));

      setView({
        obstacles: w.obstacles.map(o => ({ ...o })),
        seconds,
        collisions: w.collisions,
        crashed: time < w.crashUntil,
      });

      if (w.collisions >= MAX_COLLISIONS || elapsed >= RUN_SECONDS) {
        endedRef.current = true;
        setEnded(true);
        const fullRun = elapsed >= RUN_SECONDS;
        const clean = fullRun && w.collisions === 0;
        const survived = fullRun ? RUN_SECONDS : seconds;
        if (fullRun) {
          showFeedback('correct', clean ? 'A flawless run — not a single tree!' : 'You made it to the finish line!');
        } else {
          showFeedback('wrong', 'Three bumps — the run is over');
        }
        endTimeoutRef.current = setTimeout(() => {
          finishGame({
            score: survived * POINTS_PER_SECOND + (clean ? CLEAN_RUN_BONUS : 0),
            correct: survived,
            total: RUN_SECONDS,
            isPerfect: clean,
          });
        }, 1400);
        return; // end of the rAF chain
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(endTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <GameHUD
        score={view.seconds * POINTS_PER_SECOND}
        timeLeft={RUN_SECONDS - view.seconds}
        extra={
          <div className="hud-item">
            <span className="hud-label">Chances</span>
            <span className="hud-value">
              {Array.from({ length: MAX_COLLISIONS }, (_, i) => (i < MAX_COLLISIONS - view.collisions ? '❤️' : '🩶')).join(' ')}
            </span>
          </div>
        }
      />

      <div className={`slalom-pane${view.crashed ? ' crashed' : ''}`}>
        <div className="slalom-lane-line" style={{ left: '33.33%' }} />
        <div className="slalom-lane-line" style={{ left: '66.66%' }} />

        <div className="slalom-skier" style={{ left: `${lane * 33.33 + 16.66}%` }}>
          {view.crashed ? '💥' : '⛷️'}
        </div>

        {view.obstacles.map(obs => (
          <div
            key={obs.id}
            className="slalom-tree"
            style={{ bottom: `${obs.bottom}%`, left: `${obs.lane * 33.33 + 16.66}%` }}
          >
            🌲
          </div>
        ))}
      </div>

      <div className="slalom-controls">
        <button
          className="choice-btn"
          onClick={() => moveLane(-1)}
          disabled={ended || lane === 0}
        >
          ⬅️ Left
        </button>
        <button
          className="choice-btn"
          onClick={() => moveLane(1)}
          disabled={ended || lane === 2}
        >
          Right ➡️
        </button>
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function BettySlalom({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Betty Slalom"
      icon="⛷️"
      category="speed"
      level={level}
      instructions={[
        { icon: '⛷️', text: 'Ski down the mountain for 40 seconds.' },
        { icon: '🌲', text: 'Trees slide toward you — tap Left or Right (or use the arrow keys) to dodge them.' },
        { icon: '❤️', text: 'You can bump 2 trees and keep going. The third bump ends the run.' },
      ]}
      tip="Watch the bottom of the slope — that's where the next tree appears."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

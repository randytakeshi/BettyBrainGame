import React, { useState, useRef, useEffect } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const TOTAL_EVENTS = 12;
const PANE_H = 420;
const DECOY_SHOW_MS = 2600;

const DECOYS = [
  { variant: 'owl', icon: '🦉', bubble: 'Hoo! Hoo!', spot: 'tree' },
  { variant: 'cricket', icon: '🦗', bubble: 'chirp chirp…', spot: 'grass' },
  { variant: 'cat', icon: '🐈‍⬛', bubble: '…silent paws…', spot: 'fence' },
];

function settingsFor(level) {
  const l = Math.min(level, 5);
  return {
    reactionMs: [0, 3500, 3000, 2600, 2300, 2000][l],
    numDecoys: [0, 3, 4, 4, 5, 5][l],
    gapMin: 1800 - l * 100,
    gapExtra: 2000 - l * 150,
  };
}

function buildEvents(numDecoys) {
  const events = [
    ...Array(TOTAL_EVENTS - numDecoys).fill('bark'),
    ...Array(numDecoys).fill('decoy'),
  ];
  // Shuffle, but keep the very first event a bark so the game teaches by doing
  for (let i = events.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [events[i], events[j]] = [events[j], events[i]];
  }
  const firstBark = events.indexOf('bark');
  [events[0], events[firstBark]] = [events[firstBark], events[0]];
  return events;
}

function pointsForReaction(ms) {
  if (ms < 800) return { pts: 150, praise: 'Lightning fast' };
  if (ms < 1500) return { pts: 120, praise: 'Quick' };
  return { pts: 100, praise: 'Good' };
}

function Playfield({ level, finishGame }) {
  const { feedback, showFeedback } = useFeedback(1100);
  const S = useRef(null);
  const timersRef = useRef([]);
  const endedRef = useRef(false);
  const finishRef = useRef(finishGame);
  finishRef.current = finishGame;

  const [view, setView] = useState({
    trial: 0, score: 0, correct: 0, neighbors: 0, event: null, hint: '',
  });
  const [niniLeft, setNiniLeft] = useState(30);

  useEffect(() => {
    const { reactionMs, numDecoys, gapMin, gapExtra } = settingsFor(level);
    S.current = {
      events: buildEvents(numDecoys),
      trial: 0,           // 0-based index of the CURRENT event once it starts
      score: 0,
      correct: 0,
      neighbors: 0,       // windows lit by barks that woke someone
      rts: [],
      event: null,        // { type, variant?, start, id }
      nextId: 1,
    };
    const s = S.current;

    const later = (fn, ms) => { timersRef.current.push(setTimeout(fn, ms)); };
    const publish = (hint = '') => setView({
      trial: Math.min(s.trial + (s.event ? 1 : 0), TOTAL_EVENTS),
      score: s.score, correct: s.correct, neighbors: s.neighbors,
      event: s.event ? { ...s.event } : null, hint,
    });

    const endGame = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      const avg = s.rts.length ? Math.round(s.rts.reduce((a, b) => a + b, 0) / s.rts.length) : null;
      const summary = avg != null
        ? `Average “Quiet!” time: ${(avg / 1000).toFixed(1)} seconds`
        : 'What a peaceful night!';
      showFeedback(s.neighbors === 0 ? 'correct' : 'wrong',
        s.neighbors === 0 ? `No neighbors woken! ${summary}` : `${s.neighbors} neighbor${s.neighbors > 1 ? 's' : ''} woken. ${summary}`);
      later(() => finishRef.current({
        score: s.score,
        correct: s.correct,
        total: TOTAL_EVENTS,
      }), 1400);
    };

    const finishEvent = () => {
      s.event = null;
      if (s.trial >= TOTAL_EVENTS) { publish(); endGame(); return; }
      publish();
      scheduleNext();
    };

    const scheduleNext = () => {
      later(startEvent, gapMin + Math.random() * gapExtra);
    };

    const startEvent = () => {
      if (endedRef.current) return;
      const type = s.events[s.trial];
      const id = s.nextId++;
      if (type === 'bark') {
        s.event = { type: 'bark', start: performance.now(), id };
        publish();
        later(() => {
          // Too slow — a window lights up
          if (s.event?.id !== id || endedRef.current) return;
          s.trial += 1;
          s.neighbors = Math.min(3, s.neighbors + 1);
          showFeedback('wrong', 'Too slow — a neighbor\'s light went on! 💡');
          later(finishEvent, 1150);
          s.event = { ...s.event, resolved: true };
          publish();
        }, reactionMs);
      } else {
        const decoy = DECOYS[Math.floor(Math.random() * DECOYS.length)];
        s.event = { type: 'decoy', ...decoy, start: performance.now(), id };
        publish();
        later(() => {
          // She stayed quiet and so did you — correct rejection!
          if (s.event?.id !== id || endedRef.current) return;
          s.trial += 1;
          s.correct += 1;
          s.score += 100;
          showFeedback('correct', `Good ear — that was just the ${decoy.variant}! +100`);
          later(finishEvent, 1150);
          s.event = { ...s.event, resolved: true };
          publish();
        }, DECOY_SHOW_MS);
      }
    };

    s.handleQuiet = () => {
      if (endedRef.current) return;
      const ev = s.event;
      if (!ev || ev.resolved) {
        publish('Shh… Nini is being quiet right now. Wait for the WOOF!');
        return;
      }
      if (ev.type === 'bark') {
        const rt = performance.now() - ev.start;
        const { pts, praise } = pointsForReaction(rt);
        s.trial += 1;
        s.correct += 1;
        s.score += pts;
        s.rts.push(rt);
        s.event = { ...ev, resolved: true, hushed: true };
        showFeedback('correct', `${praise} — hushed in ${(rt / 1000).toFixed(1)}s! +${pts}`);
        later(finishEvent, 1150);
        publish();
      } else {
        s.trial += 1;
        s.event = { ...ev, resolved: true };
        showFeedback('wrong', `That was just the ${ev.variant} — Nini was being good!`);
        later(finishEvent, 1150);
        publish();
      }
    };

    // Nini roams the dark yard while things are calm
    const roam = setInterval(() => {
      if (!S.current?.event && !endedRef.current) {
        setNiniLeft(12 + Math.random() * 60);
      }
    }, 2600);
    timersRef.current.push(roam);

    publish();
    later(startEvent, 2200);

    const timers = timersRef.current;
    return () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); };
  }, [level, showFeedback]);

  const ev = view.event;
  const barking = ev?.type === 'bark' && !ev.resolved;
  const decoy = ev?.type === 'decoy' && !ev.resolved ? ev : null;

  const bubble = (text, style) => (
    <div style={{
      position: 'absolute',
      backgroundColor: '#FFFFFF',
      color: '#1F2430',
      fontWeight: 700,
      fontSize: '1.15rem',
      padding: '8px 18px',
      borderRadius: 18,
      border: '3px solid #1F2430',
      whiteSpace: 'nowrap',
      zIndex: 6,
      ...style,
    }} className="pop-in">
      {text}
    </div>
  );

  return (
    <>
      <GameHUD
        trial={Math.min(view.trial + 1, TOTAL_EVENTS)}
        totalTrials={TOTAL_EVENTS}
        score={view.score}
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Yell QUIET when Nini barks — but not for the owl, cricket, or cat!
      </p>

      {/* The backyard at night */}
      <div style={{
        width: '100%',
        maxWidth: 640,
        height: PANE_H,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #17213D 0%, #24304F 62%, #1C3325 62%, #16281D 100%)',
        border: '3px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--spacing-sm)',
        userSelect: 'none',
      }}>
        {/* Sky */}
        <div style={{ position: 'absolute', top: 14, right: 22, fontSize: '2.2rem', pointerEvents: 'none' }}>🌙</div>
        <div style={{ position: 'absolute', top: 30, left: 30, fontSize: '1rem', pointerEvents: 'none', opacity: 0.9 }}>✨</div>
        <div style={{ position: 'absolute', top: 60, left: '46%', fontSize: '0.8rem', pointerEvents: 'none', opacity: 0.8 }}>✨</div>

        {/* Neighbor houses — windows light up when barks go unhushed */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', top: 92, left: `${8 + i * 34}%`, width: 74,
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: '2rem', lineHeight: 1 }}>🏠</div>
            <div style={{
              fontSize: '0.95rem', lineHeight: 1.4, marginTop: 2,
              borderRadius: 6,
              backgroundColor: view.neighbors > i ? '#FDE68A' : '#0F1730',
              border: '2px solid #3B4A6B',
              color: view.neighbors > i ? '#7F1D1D' : '#3B4A6B',
              fontWeight: 700,
            }}>
              {view.neighbors > i ? (i === 2 ? '😠' : '💡') : '🌑'}
            </div>
          </div>
        ))}

        {/* Tree + fence line */}
        <div style={{ position: 'absolute', top: 118, right: 12, fontSize: '3rem', pointerEvents: 'none' }}>🌳</div>
        <div style={{
          position: 'absolute', top: 208, left: 0, right: 0, height: 26, pointerEvents: 'none',
          background: 'repeating-linear-gradient(90deg, #4A3B28 0 16px, #3A2E1F 16px 20px)',
          borderTop: '3px solid #5A4832', borderBottom: '3px solid #2A2117',
        }} />

        {/* Decoys */}
        {decoy?.spot === 'tree' && (
          <>
            <div style={{ position: 'absolute', top: 108, right: 34, fontSize: '1.9rem', pointerEvents: 'none', zIndex: 5 }}>🦉</div>
            {bubble('Hoo! Hoo!', { top: 70, right: 20 })}
          </>
        )}
        {decoy?.spot === 'fence' && (
          <>
            <div style={{ position: 'absolute', top: 178, left: '38%', fontSize: '1.9rem', pointerEvents: 'none', zIndex: 5 }}>🐈‍⬛</div>
            {bubble('…silent paws…', { top: 146, left: '30%' })}
          </>
        )}
        {decoy?.spot === 'grass' && (
          <>
            <div style={{ position: 'absolute', bottom: 44, right: '20%', fontSize: '1.6rem', pointerEvents: 'none', zIndex: 5 }}>🦗</div>
            {bubble('chirp chirp…', { bottom: 84, right: '12%' })}
          </>
        )}

        {/* The squirrel that starts all the trouble */}
        {barking && (
          <div style={{
            position: 'absolute', top: 186, fontSize: '1.8rem', pointerEvents: 'none', zIndex: 5,
            left: 0,
            animation: 'squirrelDash 1.6s linear forwards',
          }}>
            🐿️
          </div>
        )}
        <style>{`@keyframes squirrelDash { 0% { left: -50px; } 100% { left: 105%; } }`}</style>

        {/* Nini */}
        <div style={{
          position: 'absolute',
          bottom: 26,
          left: `${barking ? 44 : niniLeft}%`,
          width: 100,
          textAlign: 'center',
          transition: 'left 2.2s ease',
          pointerEvents: 'none',
          zIndex: 4,
        }}>
          {barking && bubble('WOOF! WOOF!', { top: -46, left: -14, fontSize: '1.4rem', borderColor: 'var(--error)' })}
          {ev?.hushed && bubble('…okay 🤍', { top: -40, left: 6 })}
          <div className={barking ? 'shake' : ''} style={{ fontSize: '2.6rem', lineHeight: 1.1, animationIterationCount: 'infinite' }}>
            🐶
          </div>
          <div style={{
            fontSize: '0.75rem', fontWeight: 700, color: '#FFF',
            background: 'linear-gradient(90deg, #1F2430 50%, #6B7280 50%)',
            borderRadius: 'var(--radius-full)', display: 'inline-block', padding: '0 10px',
            border: '1px solid #94A3B8',
          }}>
            Nini
          </div>
        </div>
      </div>

      <button
        className="primary big"
        onPointerDown={() => S.current?.handleQuiet()}
        style={{
          width: '100%',
          maxWidth: 560,
          minHeight: 110,
          fontSize: '1.7rem',
          backgroundColor: barking ? 'var(--error)' : 'var(--brand)',
        }}
      >
        🤫 QUIET!
      </button>

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1rem', minHeight: '1.5em', marginTop: 8 }}>
        {view.hint || ' '}
      </p>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function NiniBarks({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Nini Barks!"
      icon="🌙"
      category="speed"
      level={level}
      instructions={[
        { icon: '🌙', text: 'It\'s nighttime — Nini is out back chasing squirrels, and her barking wakes the neighbors!' },
        { icon: '🤫', text: 'The moment she barks WOOF! WOOF!, tap the big QUIET button as fast as you can.' },
        { icon: '🦉', text: 'But listen carefully — don\'t yell at the owl, the cricket, or the cat. Only Nini!' },
      ]}
      tip="Keep your finger resting near the QUIET button, eyes on Nini."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

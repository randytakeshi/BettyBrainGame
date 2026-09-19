import React, { useState, useRef, useEffect, useCallback } from 'react';
import { loadYouTubeApi } from '../lib/youtube';

// Guided calm-down videos, streamed from their creators' official YouTube
// channels — nothing is hosted here. Both are verified embeddable.
const VIDEOS = [
  {
    videoId: '8vkYJf8DOsc',
    icon: '🫧',
    title: 'Breathe With the Circle',
    blurb: 'Gentle music, no talking. Just follow the shape.',
    minutes: 'About 5 minutes',
  },
  {
    videoId: 'WGG7MGgptxE',
    icon: '💬',
    title: 'A Kind Voice to Sit With You',
    blurb: 'A calm therapist talks you through it, step by step.',
    minutes: 'About 5 minutes',
  },
];

// Paced breathing: a long exhale is the part that slows a racing heart.
const INHALE_MS = 4000;
const EXHALE_MS = 6000;
const CYCLE_MS = INHALE_MS + EXHALE_MS;

// Smooth ease so the circle drifts instead of snapping.
const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

/**
 * Breathing pacer driven by requestAnimationFrame, NOT CSS animation or
 * transition — Reduce Motion (index.css) clamps those to 0.01ms, which would
 * freeze the circle. The scale is written straight to the node each frame.
 */
function BreathingCircle({ onStop }) {
  const circleRef = useRef(null);
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    let raf;
    let start = null;
    let lastPhase = null;

    const tick = (now) => {
      if (start === null) start = now;
      const t = (now - start) % CYCLE_MS;
      const inhaling = t < INHALE_MS;
      const progress = inhaling ? t / INHALE_MS : (t - INHALE_MS) / EXHALE_MS;
      const scale = inhaling
        ? 0.55 + 0.45 * ease(progress)
        : 1 - 0.45 * ease(progress);

      if (circleRef.current) {
        circleRef.current.style.transform = `scale(${scale.toFixed(3)})`;
      }
      const next = inhaling ? 'in' : 'out';
      if (next !== lastPhase) {
        lastPhase = next;
        setPhase(next);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="card" style={{ width: '100%', marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
      <div
        style={{
          height: 260,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        <div
          ref={circleRef}
          aria-hidden="true"
          style={{
            width: 220,
            height: 220,
            borderRadius: '50%',
            backgroundColor: 'var(--cat-flexibility-soft)',
            border: '6px solid var(--cat-flexibility)',
            transform: 'scale(0.55)',
          }}
        />
      </div>

      <div
        aria-live="polite"
        style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--cat-flexibility)', marginBottom: 4 }}
      >
        {phase === 'in' ? 'Breathe in…' : 'Breathe out…'}
      </div>
      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Grow bigger, breathe in. Shrink down, breathe out.
        <br />
        Keep going as long as you like.
      </p>
      <button className="secondary" onClick={onStop}>✓ I'm Done</button>
    </div>
  );
}

export function CalmCorner({ onBack }) {
  const holderRef = useRef(null);
  const playerRef = useRef(null);

  const slowTimerRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(null);
  // 'idle' | 'loading' | 'playing' | 'paused' — a buffering player must never
  // be labelled "paused": that reads as "broken" over a black box.
  const [status, setStatus] = useState('idle');
  const [slowLoad, setSlowLoad] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [breathing, setBreathing] = useState(false);

  const isPlaying = status === 'playing';

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!playerRef.current) setFailed(true); }, 10000);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !holderRef.current) return;
      playerRef.current = new YT.Player(holderRef.current, {
        width: '100%',
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: { rel: 0, playsinline: 1, cc_load_policy: 1, cc_lang_pref: 'en' },
        events: {
          onReady: () => { if (!cancelled) { clearTimeout(timeout); setReady(true); } },
          onStateChange: (e) => {
            if (cancelled) return;
            if (e.data === YT.PlayerState.PLAYING) {
              clearTimeout(slowTimerRef.current);
              setSlowLoad(false);
              setStatus('playing');
            } else if (e.data === YT.PlayerState.BUFFERING) {
              setStatus('loading');
            } else if (e.data === YT.PlayerState.PAUSED) {
              setStatus('paused');
            } else if (e.data === YT.PlayerState.ENDED) {
              clearTimeout(slowTimerRef.current);
              setStatus('paused');
            }
          },
          // A pulled or blocked video must never leave her staring at a dead
          // black box — fall back to the circle, which needs no network.
          onError: () => {
            if (cancelled) return;
            clearTimeout(slowTimerRef.current);
            setCurrent(null);
            setStatus('idle');
            setSlowLoad(false);
            setVideoFailed(true);
            setBreathing(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      clearTimeout(slowTimerRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, []);

  const playVideo = useCallback((index) => {
    const player = playerRef.current;
    if (!player || !VIDEOS[index]) return;
    setBreathing(false);
    setVideoFailed(false);
    setSlowLoad(false);
    setStatus('loading');
    setCurrent(index);
    player.loadVideoById(VIDEOS[index].videoId);

    // A video that never starts (slow line, autoplay blocked) leaves her
    // waiting on a black box — offer the circle instead after a few seconds.
    clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => setSlowLoad(true), 8000);
  }, []);

  const togglePause = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.getPlayerState?.() === 1) player.pauseVideo();
    else player.playVideo();
  };

  const stopVideo = () => {
    clearTimeout(slowTimerRef.current);
    playerRef.current?.stopVideo();
    setStatus('idle');
    setSlowLoad(false);
    setCurrent(null);
  };

  const startBreathing = () => {
    clearTimeout(slowTimerRef.current);
    playerRef.current?.pauseVideo?.();
    setStatus('idle');
    setSlowLoad(false);
    setCurrent(null);
    setBreathing(true);
  };

  const nowPlaying = current != null ? VIDEOS[current] : null;

  return (
    <div className="game-view" style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 'var(--spacing-xl)' }}>
      <div style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}>
        <button className="back-btn" onClick={onBack}>← Back to Home</button>
      </div>

      <div style={{ fontSize: '3.4rem', lineHeight: 1 }} aria-hidden="true">🌿</div>
      <h1 style={{ marginBottom: 4 }}>Calm Corner</h1>
      <p style={{
        color: 'var(--text-secondary)', fontWeight: 700,
        marginBottom: 'var(--spacing-md)', textAlign: 'center',
      }}>
        Your heart is racing, but you are safe.
        <br />
        This feeling always passes. Pick one and follow along.
      </p>

      {/* One tap from the home screen to slow breathing — no reading required. */}
      <button
        className="primary big"
        style={{ width: '100%', maxWidth: 520, marginBottom: 'var(--spacing-md)' }}
        onClick={() => (ready && !videoFailed ? playVideo(0) : startBreathing())}
      >
        🫧 Start Breathing With Me
      </button>

      {breathing && <BreathingCircle onStop={() => setBreathing(false)} />}

      {videoFailed && (
        <div className="card" style={{ width: '100%', marginBottom: 'var(--spacing-md)', textAlign: 'center', fontWeight: 700 }}>
          That video would not load right now. Breathe with the circle instead —
          it works with no internet at all.
        </div>
      )}

      {failed && !ready && (
        <div className="card" style={{ width: '100%', marginBottom: 'var(--spacing-md)', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 700 }}>
          The videos need an internet connection, but the breathing circle above
          works without one. Tap the big button and follow it.
        </div>
      )}

      {/* Player — kept mounted; hidden until a video is chosen */}
      <div className="card" style={{
        width: '100%',
        marginBottom: 'var(--spacing-md)',
        textAlign: 'center',
        padding: 'var(--spacing-sm)',
        display: nowPlaying ? 'block' : 'none',
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 6 }}>
          {status === 'playing' ? '♪ NOW PLAYING' : status === 'loading' ? '⏳ LOADING…' : '⏸ PAUSED'}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 10 }}>
          {nowPlaying?.title}
        </div>
        <div style={{
          width: '100%', aspectRatio: '16 / 9', borderRadius: 'var(--radius-md)',
          overflow: 'hidden', backgroundColor: '#000', marginBottom: 12,
        }}>
          <div ref={holderRef} style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="secondary" onClick={togglePause}>
            {isPlaying ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button className="ghost" onClick={stopVideo}>⏹ Stop</button>
        </div>
        {slowLoad && status !== 'playing' && (
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', marginTop: 12, marginBottom: 0 }}>
            Still loading. Tap the video once to start it — or tap below to
            breathe with the circle instead.
          </p>
        )}
      </div>

      <div className="game-list" style={{ width: '100%' }}>
        {VIDEOS.map((video, i) => {
          const active = current === i;
          return (
            <button
              key={video.videoId}
              className="game-row"
              onClick={() => (active ? togglePause() : playVideo(i))}
              disabled={!ready}
              style={active ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-soft)' } : undefined}
            >
              <span className="game-row-icon" aria-hidden="true">{video.icon}</span>
              <span className="game-row-text">
                <span className="game-row-title">{video.title}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>
                  {video.blurb} · {video.minutes}
                </span>
                {active && (
                  <span style={{ color: 'var(--brand)', fontWeight: 700, fontSize: '0.9rem' }}>
                    {isPlaying ? 'Playing — tap to pause' : 'Paused — tap to resume'}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        <button className="game-row" onClick={startBreathing}>
          <span className="game-row-icon" aria-hidden="true">⭕</span>
          <span className="game-row-text">
            <span className="game-row-title">Just the Breathing Circle</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>
              Quiet, right here in the app · Works with no internet
            </span>
          </span>
        </button>
      </div>

      <p style={{
        color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem',
        textAlign: 'center', marginTop: 'var(--spacing-md)', maxWidth: 520,
      }}>
        If the racing feeling will not ease, or you have chest pain or trouble
        breathing, call someone you trust or 911.
      </p>
    </div>
  );
}

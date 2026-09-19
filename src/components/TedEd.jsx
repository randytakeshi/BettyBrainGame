import React, { useState, useRef, useEffect, useCallback } from 'react';
import { loadYouTubeApi } from '../lib/youtube';

// TED-Ed's uploads playlist. Playing this keeps the "newest lessons" button
// fresh forever without an API key or a code change.
const TED_ED_UPLOADS = 'UUsooa4yRKGN_zEE8iknghZA';

// Hand-picked lessons, all verified playable in an embed. Titles are the real
// ones (author credit trimmed so they stay readable at Betty's type size);
// the one-liners underneath are ours.
const LESSONS = [
  {
    videoId: '_gP3aXvNmv8',
    icon: '🚪',
    title: 'Ever walk into a room and forget what you were doing?',
    blurb: 'Why doorways make us forget — and why it is perfectly normal.',
  },
  {
    videoId: 'I8XaYkRW1tA',
    icon: '🧭',
    title: 'Why do some people have a better sense of direction?',
    blurb: 'What makes certain people natural navigators.',
  },
  {
    videoId: 'l29K-ZkARmE',
    icon: '🏺',
    title: 'The tragedy of Cassandra, the princess who predicted the fall of Troy',
    blurb: 'A Greek myth about the woman nobody would believe.',
  },
  {
    videoId: 'krNP8RlDsbw',
    icon: '🌺',
    title: "Red gold: The world's most expensive spice",
    blurb: 'Why saffron is worth more by weight than gold.',
  },
  {
    videoId: '5jPCAlE0z7I',
    icon: '🌊',
    title: 'The magical forest realm hiding at the bottom of the ocean',
    blurb: 'The underwater kelp forests almost nobody sees.',
  },
  {
    videoId: '2A1IEBFt6Xg',
    icon: '🚄',
    title: 'How do Maglev trains work?',
    blurb: 'The trains that float just above the track.',
  },
  {
    videoId: 'JhxuP0AuRPA',
    icon: '📘',
    title: 'When did we start using passports?',
    blurb: 'How a slip of paper became proof of who you are.',
  },
  {
    videoId: 'QyRqlTV60zM',
    icon: '⛵',
    title: "Plato's famous Ship of State thought experiment",
    blurb: 'An ancient puzzle about who should be allowed to steer.',
  },
];

export function TedEd({ onBack }) {
  const holderRef = useRef(null);
  const playerRef = useRef(null);
  const slowTimerRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(null);
  const [playlistMode, setPlaylistMode] = useState(false);
  // 'idle' | 'loading' | 'playing' | 'paused' — a buffering player must never
  // be labelled "paused": that reads as broken over a black box.
  const [status, setStatus] = useState('idle');
  const [slowLoad, setSlowLoad] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  // In playlist mode we don't know the titles up front, so ask the player.
  const [livingTitle, setLivingTitle] = useState('');

  const isPlaying = status === 'playing';
  const showPlayer = current != null || playlistMode;

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!playerRef.current) setFailed(true); }, 10000);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !holderRef.current) return;
      playerRef.current = new YT.Player(holderRef.current, {
        width: '100%',
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        // Captions on by default — TED-Ed narrates quickly, and reading along
        // helps far more than it costs.
        playerVars: { rel: 0, playsinline: 1, cc_load_policy: 1, cc_lang_pref: 'en' },
        events: {
          onReady: () => { if (!cancelled) { clearTimeout(timeout); setReady(true); } },
          onStateChange: (e) => {
            if (cancelled) return;
            if (e.data === YT.PlayerState.PLAYING) {
              clearTimeout(slowTimerRef.current);
              setSlowLoad(false);
              setStatus('playing');
              setLivingTitle(playerRef.current?.getVideoData?.()?.title || '');
            } else if (e.data === YT.PlayerState.BUFFERING) {
              setStatus('loading');
            } else if (e.data === YT.PlayerState.PAUSED) {
              setStatus('paused');
            } else if (e.data === YT.PlayerState.ENDED) {
              // A playlist advances itself; a single lesson is simply over.
              clearTimeout(slowTimerRef.current);
              setStatus('paused');
            }
          },
          onError: () => {
            if (cancelled) return;
            clearTimeout(slowTimerRef.current);
            setStatus('idle');
            setSlowLoad(false);
            setVideoFailed(true);
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

  // A lesson that never starts leaves her waiting on a black box.
  const armSlowLoadHint = () => {
    clearTimeout(slowTimerRef.current);
    setSlowLoad(false);
    slowTimerRef.current = setTimeout(() => setSlowLoad(true), 8000);
  };

  const playLesson = useCallback((index) => {
    const player = playerRef.current;
    if (!player || !LESSONS[index]) return;
    setVideoFailed(false);
    setPlaylistMode(false);
    setStatus('loading');
    setCurrent(index);
    setLivingTitle('');
    player.loadVideoById(LESSONS[index].videoId);
    armSlowLoadHint();
  }, []);

  const playNewest = () => {
    const player = playerRef.current;
    if (!player) return;
    setVideoFailed(false);
    setCurrent(null);
    setStatus('loading');
    setLivingTitle('');
    setPlaylistMode(true);
    player.loadPlaylist({ list: TED_ED_UPLOADS, listType: 'playlist', index: 0 });
    armSlowLoadHint();
  };

  const togglePause = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.getPlayerState?.() === 1) player.pauseVideo();
    else player.playVideo();
  };

  const playNextLesson = () => {
    setStatus('loading');
    setLivingTitle('');
    playerRef.current?.nextVideo?.();
    armSlowLoadHint();
  };

  const stopVideo = () => {
    clearTimeout(slowTimerRef.current);
    playerRef.current?.stopVideo();
    setStatus('idle');
    setSlowLoad(false);
    setCurrent(null);
    setPlaylistMode(false);
    setLivingTitle('');
  };

  const headingTitle = playlistMode
    ? (livingTitle || 'Finding the newest lesson…')
    : (current != null ? LESSONS[current].title : '');

  return (
    <div className="game-view" style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 'var(--spacing-xl)' }}>
      <div style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}>
        <button className="back-btn" onClick={onBack}>← Back to Home</button>
      </div>

      <div style={{ fontSize: '3.4rem', lineHeight: 1 }} aria-hidden="true">🎓</div>
      <h1 style={{ marginBottom: 4 }}>TED-Ed Lessons</h1>
      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
        Short animated lessons from the TED-Ed channel on YouTube — about five
        minutes each, with captions on.
      </p>

      {failed && !ready ? (
        <div className="card" style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 700 }}>
          These lessons need an internet connection to reach YouTube.
          Please check the connection and come back!
        </div>
      ) : (
        <>
          <button
            className="primary big"
            style={{ width: '100%', maxWidth: 520, marginBottom: 'var(--spacing-md)' }}
            onClick={playNewest}
            disabled={!ready}
          >
            {ready ? '▶ Play the Newest Lessons' : 'Warming up…'}
          </button>

          {videoFailed && (
            <div className="card" style={{ width: '100%', marginBottom: 'var(--spacing-md)', textAlign: 'center', fontWeight: 700 }}>
              That lesson would not load right now. Try another one from the
              list below.
            </div>
          )}

          {/* Player — kept mounted; hidden until a lesson is chosen */}
          <div className="card" style={{
            width: '100%',
            marginBottom: 'var(--spacing-md)',
            textAlign: 'center',
            padding: 'var(--spacing-sm)',
            display: showPlayer ? 'block' : 'none',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 6 }}>
              {status === 'playing' ? '▶ NOW WATCHING' : status === 'loading' ? '⏳ LOADING…' : '⏸ PAUSED'}
              {playlistMode ? ' · NEWEST LESSONS' : ''}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 10 }}>
              {headingTitle}
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
              {playlistMode && (
                <button className="secondary" onClick={playNextLesson}>⏭ Next Lesson</button>
              )}
              <button className="ghost" onClick={stopVideo}>⏹ Stop</button>
            </div>
            {slowLoad && status !== 'playing' && (
              <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', marginTop: 12, marginBottom: 0 }}>
                Still loading. Tap the video once to start it, or pick another
                lesson below.
              </p>
            )}
          </div>

          <div className="game-list" style={{ width: '100%' }}>
            {LESSONS.map((lesson, i) => {
              const active = !playlistMode && current === i;
              return (
                <button
                  key={lesson.videoId}
                  className="game-row"
                  onClick={() => (active ? togglePause() : playLesson(i))}
                  disabled={!ready}
                  style={active ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-soft)' } : undefined}
                >
                  <span className="game-row-icon" aria-hidden="true">{lesson.icon}</span>
                  <span className="game-row-text">
                    <span className="game-row-title">{lesson.title}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>
                      {lesson.blurb}
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
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';

// All tracks stream from kenwoojin's official YouTube channel — no audio
// files are hosted in this repo or on the site.
const SONGS = [
  { videoId: 'XoMbSONfptU', title: 'Couch Outside' },
  { videoId: 'qnPxD5sCDbo', title: 'Monday to Sunday' },
  { videoId: 'GlSc6MUGH7s', title: 'Rambling' },
  { videoId: '9DazTotTgeo', title: 'Voicemail' },
  { videoId: 'i_Ge1eVRrG0', title: "Won't Let Go" },
  { videoId: 'D-_de3JTUvM', title: 'Honey Love' },
];

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Load the YouTube IFrame API once, shared across mounts
let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT);
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    });
  }
  return ytApiPromise;
}

export function Jukebox({ onBack }) {
  const holderRef = useRef(null);
  const playerRef = useRef(null);
  const queueRef = useRef([]);
  const currentRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [finishedAll, setFinishedAll] = useState(false);

  const playIndex = useCallback((index) => {
    const player = playerRef.current;
    if (!player || !SONGS[index]) return;
    setFinishedAll(false);
    setCurrent(index);
    currentRef.current = index;
    player.loadVideoById(SONGS[index].videoId);
  }, []);

  const playNext = useCallback(() => {
    if (queueRef.current.length > 0) {
      const [next, ...rest] = queueRef.current;
      queueRef.current = rest;
      playIndex(next);
    } else {
      playerRef.current?.stopVideo();
      setIsPlaying(false);
      setCurrent(null);
      currentRef.current = null;
      setShuffleMode(false);
      setFinishedAll(true);
    }
  }, [playIndex]);
  const playNextRef = useRef(playNext);
  playNextRef.current = playNext;

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!playerRef.current) setFailed(true); }, 10000);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !holderRef.current) return;
      playerRef.current = new YT.Player(holderRef.current, {
        width: '100%',
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        // cc_load_policy: show captions/lyrics automatically whenever the
        // video has a caption track (e.g. Rambling), for read-along listening
        playerVars: { rel: 0, playsinline: 1, cc_load_policy: 1, cc_lang_pref: 'en' },
        events: {
          onReady: () => { if (!cancelled) { clearTimeout(timeout); setReady(true); } },
          onStateChange: (e) => {
            if (cancelled) return;
            if (e.data === YT.PlayerState.ENDED) playNextRef.current();
            else if (e.data === YT.PlayerState.PLAYING) setIsPlaying(true);
            else if (e.data === YT.PlayerState.PAUSED) setIsPlaying(false);
          },
          onError: () => { if (!cancelled) playNextRef.current(); },
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, []);

  const playAllShuffled = () => {
    const order = shuffled(SONGS.map((_, i) => i));
    queueRef.current = order.slice(1);
    setShuffleMode(true);
    playIndex(order[0]);
  };

  const playSingle = (index) => {
    queueRef.current = [];
    setShuffleMode(false);
    playIndex(index);
  };

  const togglePause = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.getPlayerState?.() === 1) player.pauseVideo();
    else player.playVideo();
  };

  const stopAll = () => {
    queueRef.current = [];
    playerRef.current?.stopVideo();
    setIsPlaying(false);
    setCurrent(null);
    currentRef.current = null;
    setShuffleMode(false);
  };

  const nowPlaying = current != null ? SONGS[current] : null;

  return (
    <div className="game-view" style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 'var(--spacing-xl)' }}>
      <div style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}>
        <button className="back-btn" onClick={onBack}>← Back to Home</button>
      </div>

      <div style={{ fontSize: '3.4rem', lineHeight: 1 }} aria-hidden="true">🎵</div>
      <h1 style={{ marginBottom: 4 }}>Kenwoojin Jukebox</h1>
      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
        Songs by Ken Woojin, streamed from YouTube — tap one, or play them all!
      </p>

      {failed && !ready ? (
        <div className="card" style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>
          The jukebox needs an internet connection to reach YouTube.
          Please check the connection and come back!
        </div>
      ) : (
        <>
          <button
            className="primary big"
            style={{ width: '100%', maxWidth: 520, marginBottom: 'var(--spacing-md)' }}
            onClick={playAllShuffled}
            disabled={!ready}
          >
            {ready ? '🔀 Play All Songs' : 'Warming up the jukebox…'}
          </button>

          {/* Player — kept mounted; hidden until a song is chosen */}
          <div className="card" style={{
            width: '100%',
            marginBottom: 'var(--spacing-md)',
            textAlign: 'center',
            padding: 'var(--spacing-sm)',
            display: nowPlaying ? 'block' : 'none',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 6 }}>
              {isPlaying ? '♪ NOW PLAYING' : '⏸ PAUSED'}{shuffleMode ? ' · PLAYING ALL' : ''}
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
              {shuffleMode && (
                <button className="secondary" onClick={playNext}>⏭ Next Song</button>
              )}
              <button className="ghost" onClick={stopAll}>⏹ Stop</button>
            </div>
          </div>

          {finishedAll && (
            <div className="card" style={{ width: '100%', marginBottom: 'var(--spacing-md)', textAlign: 'center', fontWeight: 700 }}>
              🎉 That was every song! Tap Play All to hear them again.
            </div>
          )}

          <div className="game-list" style={{ width: '100%' }}>
            {SONGS.map((song, i) => {
              const active = current === i;
              return (
                <button
                  key={song.videoId}
                  className="game-row"
                  onClick={() => (active ? togglePause() : playSingle(i))}
                  disabled={!ready}
                  style={active ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-soft)' } : undefined}
                >
                  <span className="game-row-icon" aria-hidden="true">
                    {active && isPlaying ? '🔊' : '🎵'}
                  </span>
                  <span className="game-row-text">
                    <span className="game-row-title">{i + 1}. {song.title}</span>
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

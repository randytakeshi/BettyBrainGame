import React, { useState, useCallback } from 'react';

export const CATEGORIES = {
  memory:      { label: 'Memory',          className: 'cat-memory' },
  attention:   { label: 'Attention',       className: 'cat-attention' },
  speed:       { label: 'Speed',           className: 'cat-speed' },
  flexibility: { label: 'Flexibility',     className: 'cat-flexibility' },
  language:    { label: 'Language',        className: 'cat-language' },
  logic:       { label: 'Problem Solving', className: 'cat-logic' },
  knowledge:   { label: 'Knowledge',       className: 'cat-knowledge' },
};

function starsFor(result) {
  if (result.accuracy == null) return result.isPerfect ? 3 : 2;
  if (result.accuracy >= 90) return 3;
  if (result.accuracy >= 65) return 2;
  if (result.accuracy >= 40) return 1;
  return 0;
}

function praiseFor(stars) {
  if (stars === 3) return 'Outstanding! A perfect performance.';
  if (stars === 2) return 'Great work — your brain got a real workout!';
  if (stars === 1) return 'Nice effort. You get sharper every time you play.';
  return 'Good try! Every game keeps your mind active.';
}

/**
 * Lumosity-style game wrapper: instructions screen → play → results screen.
 *
 * Usage:
 *   <GameShell
 *     title="Color Match" icon="🎨" category="flexibility" level={level}
 *     instructions={[{ icon: '👀', text: 'Read the word on the left.' }, ...]}
 *     tip="Take your time — there is no penalty for thinking."
 *     onBack={onBack} onComplete={onComplete}
 *   >
 *     {({ finishGame }) => <MyPlayfield onDone={finishGame} />}
 *   </GameShell>
 *
 * The playfield is mounted only while playing; call finishGame with
 * { score, correct, total, bestStreak? } when the round set ends.
 * When the player taps Continue on the results screen, onComplete receives
 * { score, correct, total, accuracy, isPerfect, bestStreak }.
 */
export function GameShell({
  title,
  icon,
  category = 'memory',
  level = 1,
  instructions = [],
  tip,
  onBack,
  onComplete,
  children,
}) {
  const [phase, setPhase] = useState('intro');
  const [result, setResult] = useState(null);
  const [playKey, setPlayKey] = useState(0);

  const finishGame = useCallback((res) => {
    const total = res.total ?? null;
    const correct = res.correct ?? null;
    const accuracy = total ? Math.round(((correct ?? 0) / total) * 100) : null;
    setResult({
      score: Math.max(0, Math.round(res.score ?? 0)),
      correct,
      total,
      accuracy,
      isPerfect: res.isPerfect ?? (total != null && correct === total),
      bestStreak: res.bestStreak ?? null,
    });
    setPhase('results');
  }, []);

  const cat = CATEGORIES[category] || CATEGORIES.memory;

  if (phase === 'intro') {
    return (
      <div className="shell-screen pop-in">
        <div className="shell-topbar">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <span className={`chip ${cat.className}`}>{cat.label}</span>
        </div>
        <div className="shell-icon" aria-hidden="true">{icon}</div>
        <h1>{title}</h1>
        <div className="shell-level">Level {level}</div>
        <div className="shell-instructions">
          {instructions.map((step, i) => (
            <div key={i} className="shell-instruction-row">
              <div className="shell-instruction-icon" aria-hidden="true">{step.icon}</div>
              <div>{step.text}</div>
            </div>
          ))}
        </div>
        {tip && <div className="shell-tip">💡 {tip}</div>}
        <button
          className="primary big"
          style={{ width: '100%', maxWidth: 460 }}
          onClick={() => setPhase('playing')}
        >
          Start Game
        </button>
      </div>
    );
  }

  if (phase === 'results' && result) {
    const stars = starsFor(result);
    return (
      <div className="shell-screen pop-in">
        <div className="shell-icon" aria-hidden="true">{icon}</div>
        <h2>{title} Complete!</h2>
        <div className="results-stars" aria-label={`${stars} out of 3 stars`}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ opacity: i < stars ? 1 : 0.22 }}>⭐</span>
          ))}
        </div>
        <div className="results-score-label">Points Earned</div>
        <div className="results-score">{result.score}</div>
        <div className="results-stats">
          {result.accuracy != null && (
            <div className="results-stat">
              <div className="results-stat-value" style={{ color: 'var(--cat-flexibility)' }}>
                {result.accuracy}%
              </div>
              <div className="results-stat-label">Accuracy</div>
            </div>
          )}
          {result.total != null && (
            <div className="results-stat">
              <div className="results-stat-value" style={{ color: 'var(--cat-memory)' }}>
                {result.correct} of {result.total}
              </div>
              <div className="results-stat-label">Correct Answers</div>
            </div>
          )}
          {result.bestStreak != null && result.bestStreak > 1 && (
            <div className="results-stat">
              <div className="results-stat-value" style={{ color: 'var(--gold)' }}>
                {result.bestStreak} in a row
              </div>
              <div className="results-stat-label">Best Streak</div>
            </div>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
          {praiseFor(stars)}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', width: '100%', maxWidth: 460 }}>
          <button className="primary big" onClick={() => onComplete(result)}>
            Continue
          </button>
          <button
            className="secondary"
            onClick={() => { setResult(null); setPlayKey(k => k + 1); setPhase('playing'); }}
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell-screen" key={playKey}>
      <div className="shell-topbar">
        <button className="back-btn" onClick={onBack}>← Quit</button>
        <span className={`chip ${cat.className}`}>{cat.label}</span>
      </div>
      {typeof children === 'function' ? children({ finishGame }) : children}
    </div>
  );
}

/** Score / round HUD shown above the playfield. */
export function GameHUD({ trial, totalTrials, score, streak, timeLeft, extra }) {
  const showDots = totalTrials != null && totalTrials <= 12;
  return (
    <div className="game-hud">
      {totalTrials != null && (
        <div className="hud-item" style={{ alignItems: 'flex-start' }}>
          <span className="hud-label">Round</span>
          {showDots ? (
            <div className="hud-dots" aria-label={`Round ${Math.min(trial, totalTrials)} of ${totalTrials}`}>
              {Array.from({ length: totalTrials }, (_, i) => (
                <span
                  key={i}
                  className={
                    'hud-dot' +
                    (i < trial - 1 ? ' done' : i === trial - 1 ? ' current' : '')
                  }
                />
              ))}
            </div>
          ) : (
            <span className="hud-value">{Math.min(trial, totalTrials)} of {totalTrials}</span>
          )}
        </div>
      )}
      {score != null && (
        <div className="hud-item">
          <span className="hud-label">Score</span>
          <span className="hud-value">{score}</span>
        </div>
      )}
      {streak != null && streak > 1 && (
        <div className="hud-item">
          <span className="hud-label">Streak</span>
          <span className="hud-value" style={{ color: 'var(--gold)' }}>🔥 {streak}</span>
        </div>
      )}
      {timeLeft != null && (
        <div className="hud-item">
          <span className="hud-label">Time</span>
          <span
            className="hud-value"
            style={{ color: timeLeft <= 5 ? 'var(--error)' : 'var(--text-primary)' }}
          >
            {timeLeft}s
          </span>
        </div>
      )}
      {extra}
    </div>
  );
}

/**
 * Big right/wrong flash. Usage:
 *   const { feedback, showFeedback } = useFeedback();
 *   showFeedback('correct');            // or showFeedback('wrong', 'It was BLUE')
 *   ...render <FeedbackOverlay feedback={feedback} />
 */
export function useFeedback(durationMs = 700) {
  const [feedback, setFeedback] = useState(null);

  const showFeedback = useCallback((type, detail) => {
    setFeedback({ type, detail, id: Math.random() });
    const timer = setTimeout(() => setFeedback(null), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return { feedback, showFeedback };
}

export function FeedbackOverlay({ feedback }) {
  if (!feedback) return null;
  const isCorrect = feedback.type === 'correct';
  return (
    <div className="feedback-overlay" key={feedback.id}>
      <div className={`feedback-card ${isCorrect ? 'correct' : 'wrong'}`}>
        <span>{isCorrect ? '✓ Correct!' : '✗ Not quite'}</span>
        {feedback.detail && <span className="feedback-sub">{feedback.detail}</span>}
      </div>
    </div>
  );
}

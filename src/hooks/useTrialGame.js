import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Shared engine for Lumosity-style trial games: a fixed number of rounds,
 * 100 points per correct answer, +50 bonus while on a hot streak (3+ in a
 * row), an optional speed bonus, and a big ✓/✗ flash between rounds.
 *
 * const game = useTrialGame({
 *   totalTrials: 10,
 *   timerMode,                     // adds time-based bonus at the end
 *   makeProblem: () => generateProblem(level),
 *   finishGame,                    // from GameShell
 * });
 *
 * game.problem      current problem (from makeProblem)
 * game.trial        1-based round number
 * game.score / game.streak / game.correct
 * game.locked       true while the ✓/✗ flash is showing (disable buttons)
 * game.feedback     pass to <FeedbackOverlay feedback={...} />
 * game.answer(isCorrect, detail?)  call once per round
 */
export function useTrialGame({
  totalTrials = 10,
  timerMode = false,
  speedDuration = 90,
  maxBonus = 50,
  basePoints = 100,
  streakBonus = 50,
  feedbackMs = 900,
  makeProblem,
  finishGame,
}) {
  const makeProblemRef = useRef(makeProblem);
  makeProblemRef.current = makeProblem;
  const finishGameRef = useRef(finishGame);
  finishGameRef.current = finishGame;

  const [problem, setProblem] = useState(() => (makeProblem ? makeProblem() : null));
  const [trial, setTrial] = useState(1);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const bestStreakRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const timeoutRef = useRef(null);
  const lockedRef = useRef(false);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const answer = useCallback((isCorrect, detail) => {
    // Guard against double-fire (e.g. an animationend racing a tap)
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);

    let pointsEarned = 0;
    const newStreak = isCorrect ? streak + 1 : 0;
    if (isCorrect) {
      pointsEarned = basePoints + (newStreak >= 3 ? streakBonus : 0);
      bestStreakRef.current = Math.max(bestStreakRef.current, newStreak);
    }
    const newScore = score + pointsEarned;
    const newCorrect = correct + (isCorrect ? 1 : 0);

    setStreak(newStreak);
    setScore(newScore);
    setCorrect(newCorrect);
    setFeedback({
      type: isCorrect ? 'correct' : 'wrong',
      detail: isCorrect && newStreak >= 3 ? `+${pointsEarned} points — ${newStreak} in a row!` : detail,
      id: Math.random(),
    });

    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
      if (trial >= totalTrials) {
        let bonus = 0;
        if (timerMode) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          bonus = Math.max(0, Math.floor(maxBonus * (1 - elapsed / speedDuration)));
        }
        finishGameRef.current({
          score: newScore + bonus,
          correct: newCorrect,
          total: totalTrials,
          bestStreak: bestStreakRef.current,
        });
      } else {
        setTrial(t => t + 1);
        if (makeProblemRef.current) setProblem(makeProblemRef.current());
        lockedRef.current = false;
        setLocked(false);
      }
    }, feedbackMs);
  }, [trial, totalTrials, score, correct, streak, timerMode, speedDuration, maxBonus, basePoints, streakBonus, feedbackMs]);

  return { problem, trial, score, correct, streak, locked, feedback, answer };
}

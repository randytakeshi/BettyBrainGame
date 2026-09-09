import React, { useState, useEffect } from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { useTrialGame } from '../../hooks/useTrialGame';

const TOTAL_TRIALS = 10;

function makeProblem(level) {
  const maxNum = level === 1 ? 10 : level === 2 ? 20 : level === 3 ? 50 : 99;
  const op = Math.random() < 0.5 ? '+' : '−';

  let num1, num2;
  if (op === '+') {
    num1 = Math.floor(Math.random() * maxNum) + 1;
    num2 = Math.floor(Math.random() * maxNum) + 1;
  } else {
    num1 = Math.floor(Math.random() * Math.floor(maxNum * 1.5)) + 5;
    num2 = Math.floor(Math.random() * num1); // never a negative answer
  }

  const answer = op === '+' ? num1 + num2 : num1 - num2;

  const choices = new Set([answer]);
  while (choices.size < 3) {
    const wrong = answer + (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
    if (wrong >= 0) choices.add(wrong);
  }

  return {
    num1,
    num2,
    op,
    answer,
    choices: Array.from(choices).sort(() => Math.random() - 0.5),
  };
}

function Playfield({ level, finishGame }) {
  const game = useTrialGame({
    totalTrials: TOTAL_TRIALS,
    makeProblem: () => makeProblem(level),
    finishGame,
  });
  const p = game.problem;
  const [picked, setPicked] = useState(null);

  useEffect(() => setPicked(null), [p]);

  const choose = (choice) => {
    setPicked(choice);
    game.answer(choice === p.answer, `The answer was ${p.answer}`);
  };

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Pick the correct answer.
      </p>

      <div
        className="card"
        style={{
          fontSize: '3rem',
          fontWeight: 700,
          textAlign: 'center',
          margin: '0 0 var(--spacing-lg)',
          width: '100%',
        }}
      >
        {p.num1} {p.op} {p.num2} = ?
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--spacing-md)',
        width: '100%',
        maxWidth: 620,
      }}>
        {p.choices.map((choice) => (
          <button
            key={choice}
            className={
              'choice-btn' +
              (game.locked && choice === p.answer ? ' correct'
                : game.locked && choice === picked ? ' wrong'
                : '')
            }
            style={{ fontSize: '2.4rem', minHeight: 120 }}
            onClick={() => choose(choice)}
            disabled={game.locked}
          >
            {choice}
          </button>
        ))}
      </div>

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function MathMaster({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Math Master"
      icon="➕"
      category="logic"
      level={level}
      instructions={[
        { icon: '🔢', text: 'An addition or subtraction problem appears.' },
        { icon: '👆', text: 'Tap the correct answer from the three choices.' },
        { icon: '🔥', text: 'Get 3 right in a row for bonus points!' },
      ]}
      tip="Round to friendly numbers first — 19 + 12 is close to 20 + 12."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

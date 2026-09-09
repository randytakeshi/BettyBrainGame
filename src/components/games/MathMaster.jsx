import React, { useState, useEffect } from 'react';

const generateProblem = (level) => {
  const operations = ['+', '-'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let num1, num2;
  
  const maxNum = level === 1 ? 10 : level === 2 ? 20 : level === 3 ? 50 : 99;
  
  if (op === '+') {
    num1 = Math.floor(Math.random() * maxNum) + 1;
    num2 = Math.floor(Math.random() * maxNum) + 1;
  } else {
    num1 = Math.floor(Math.random() * (maxNum * 1.5)) + 5;
    num2 = Math.floor(Math.random() * num1); // Ensure no negative answers
  }
  
  const answer = op === '+' ? num1 + num2 : num1 - num2;
  
  // Generate 3 choices (1 correct, 2 incorrect)
  let choices = new Set([answer]);
  while(choices.size < 3) {
    let wrong = answer + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
    if (wrong >= 0) choices.add(wrong);
  }
  
  return {
    num1,
    num2,
    op,
    answer,
    choices: Array.from(choices).sort(() => Math.random() - 0.5)
  };
};

export function MathMaster({ level = 1, onComplete, onBack }) {
  const [problem, setProblem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const MAX_ROUNDS = 5;

  useEffect(() => {
    setProblem(generateProblem(level));
  }, [level]);

  const handleAnswer = (choice) => {
    const isCorrect = choice === problem.answer;
    if (isCorrect) {
      setFeedback('correct');
      setCorrectCount(prev => prev + 1);
    } else {
      setFeedback('incorrect');
    }

    setTimeout(() => {
      const nextRound = rounds + 1;
      if (nextRound >= MAX_ROUNDS) {
        if (onComplete) {
          onComplete({ 
            score: Math.floor((correctCount + (isCorrect ? 1 : 0)) / MAX_ROUNDS * 100),
            isPerfect: (correctCount + (isCorrect ? 1 : 0)) === MAX_ROUNDS
          });
        }
      } else {
        setRounds(nextRound);
        setProblem(generateProblem(level));
        setFeedback(null);
      }
    }, 1000);
  };

  if (!problem) return null;

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | {rounds + 1}/{MAX_ROUNDS}
        </div>
      </div>
      
      <div style={{
        fontSize: '6rem', 
        fontWeight: 'bold', 
        margin: 'var(--spacing-xl) 0',
        color: feedback === 'correct' ? 'var(--accent-success)' : feedback === 'incorrect' ? 'var(--accent-error)' : 'var(--text-primary)',
        transition: 'color 0.3s'
      }}>
        {problem.num1} {problem.op} {problem.num2} = ?
      </div>
      
      <div style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 'var(--spacing-lg)', 
        width: '100%', 
        maxWidth: '600px'
      }}>
        {problem.choices.map((choice, i) => (
          <button 
            key={i} 
            className="secondary" 
            style={{ fontSize: '3rem', padding: 'var(--spacing-md)' }}
            onClick={() => handleAnswer(choice)}
            disabled={feedback !== null}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

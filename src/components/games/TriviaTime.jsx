import React, { useState, useEffect } from 'react';

const QUESTIONS = {
  1: [
    { q: "What is the capital of France?", options: ["Paris", "London", "Rome"], answer: "Paris" },
    { q: "How many days are in a week?", options: ["5", "7", "10"], answer: "7" },
    { q: "What color do you get by mixing red and yellow?", options: ["Green", "Orange", "Purple"], answer: "Orange" },
    { q: "Which animal is known as man's best friend?", options: ["Cat", "Dog", "Bird"], answer: "Dog" },
    { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Pacific", "Indian"], answer: "Pacific" }
  ],
  2: [
    { q: "Who was the 16th US President?", options: ["George Washington", "Abraham Lincoln", "Thomas Jefferson"], answer: "Abraham Lincoln" },
    { q: "In what decade did the first man walk on the moon?", options: ["1950s", "1960s", "1970s"], answer: "1960s" },
    { q: "What is the main ingredient in guacamole?", options: ["Tomato", "Avocado", "Onion"], answer: "Avocado" },
    { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter"], answer: "Mars" },
    { q: "What is the chemical symbol for water?", options: ["O2", "H2O", "CO2"], answer: "H2O" }
  ],
  3: [
    { q: "Who painted the Mona Lisa?", options: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso"], answer: "Leonardo da Vinci" },
    { q: "What is the longest river in the world?", options: ["Amazon", "Nile", "Mississippi"], answer: "Nile" },
    { q: "In what year did World War II end?", options: ["1941", "1945", "1950"], answer: "1945" },
    { q: "Which element has the chemical symbol 'Au'?", options: ["Silver", "Gold", "Iron"], answer: "Gold" },
    { q: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen"], answer: "William Shakespeare" }
  ]
};

const generateProblem = (level, usedIndices) => {
  const pool = QUESTIONS[Math.min(level, 3)];
  let available = pool.map((_, i) => i).filter(i => !usedIndices.includes(i));
  
  if (available.length === 0) {
    // Reset if we ran out of questions for this level
    available = pool.map((_, i) => i);
    usedIndices.length = 0; // mutate to empty
  }
  
  const selectedIndex = available[Math.floor(Math.random() * available.length)];
  const qData = pool[selectedIndex];
  
  return { 
    ...qData, 
    index: selectedIndex,
    options: [...qData.options].sort(() => Math.random() - 0.5) 
  };
};

export function TriviaTime({ level = 1, onComplete, onBack }) {
  const [problem, setProblem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [usedIndices] = useState([]);
  const MAX_ROUNDS = 5;

  useEffect(() => {
    const prob = generateProblem(level, usedIndices);
    usedIndices.push(prob.index);
    setProblem(prob);
  }, [level, usedIndices]);

  const handleChoice = (choice) => {
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
        const prob = generateProblem(level, usedIndices);
        usedIndices.push(prob.index);
        setProblem(prob);
        setFeedback(null);
      }
    }, 1200);
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
        fontSize: '2.5rem',
        fontWeight: 'bold',
        marginBottom: 'var(--spacing-xl)',
        textAlign: 'center',
        padding: '0 var(--spacing-md)'
      }}>
        {problem.q}
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        width: '100%',
        maxWidth: '600px'
      }}>
        {problem.options.map((option, index) => {
          let bgColor = 'var(--surface-color)';
          if (feedback !== null) {
            if (option === problem.answer) bgColor = 'var(--accent-success)';
            else if (feedback === 'incorrect') bgColor = 'var(--accent-error)';
          }

          return (
            <button
              key={index}
              onClick={() => handleChoice(option)}
              disabled={feedback !== null}
              className="secondary"
              style={{
                fontSize: '2rem',
                padding: 'var(--spacing-md)',
                backgroundColor: bgColor,
                color: feedback !== null && option === problem.answer ? '#000' : 'var(--text-primary)',
                transition: 'background-color 0.3s'
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

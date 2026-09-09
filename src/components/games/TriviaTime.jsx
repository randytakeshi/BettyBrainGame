import React, { useState, useEffect, useRef } from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { useTrialGame } from '../../hooks/useTrialGame';

const QUESTIONS_BY_LEVEL = {
  1: [
    { q: 'What is the capital of France?', options: ['Paris', 'London', 'Rome'], answer: 'Paris' },
    { q: 'How many days are in a week?', options: ['5', '7', '10'], answer: '7' },
    { q: 'What color do you get by mixing red and yellow?', options: ['Green', 'Orange', 'Purple'], answer: 'Orange' },
    { q: "Which animal is known as man's best friend?", options: ['Cat', 'Dog', 'Bird'], answer: 'Dog' },
    { q: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Pacific', 'Indian'], answer: 'Pacific' },
    { q: 'How many states are in the United States?', options: ['48', '50', '52'], answer: '50' },
    { q: 'What do bees make?', options: ['Honey', 'Milk', 'Silk'], answer: 'Honey' },
    { q: 'Which season comes right after winter?', options: ['Summer', 'Spring', 'Fall'], answer: 'Spring' },
    { q: 'Which bird is the symbol of the United States?', options: ['Robin', 'Bald eagle', 'Blue jay'], answer: 'Bald eagle' },
    { q: 'How many cents are in a quarter?', options: ['10', '25', '50'], answer: '25' },
    { q: 'Which meal is traditionally eaten first in the day?', options: ['Supper', 'Breakfast', 'Lunch'], answer: 'Breakfast' },
    { q: 'What color is a ripe banana?', options: ['Yellow', 'Red', 'Blue'], answer: 'Yellow' },
    { q: 'Which holiday falls on December 25th?', options: ['Easter', 'Christmas', 'Thanksgiving'], answer: 'Christmas' },
    { q: 'How many legs does a spider have?', options: ['Six', 'Eight', 'Ten'], answer: 'Eight' },
    { q: 'Which fruit is said to keep the doctor away?', options: ['An apple', 'A peach', 'A plum'], answer: 'An apple' },
    { q: 'What do you call water once it freezes?', options: ['Steam', 'Ice', 'Fog'], answer: 'Ice' },
  ],
  2: [
    { q: 'Who was the 16th President of the United States?', options: ['George Washington', 'Abraham Lincoln', 'Thomas Jefferson'], answer: 'Abraham Lincoln' },
    { q: 'In what decade did the first man walk on the moon?', options: ['1950s', '1960s', '1970s'], answer: '1960s' },
    { q: 'What is the main ingredient in guacamole?', options: ['Tomato', 'Avocado', 'Onion'], answer: 'Avocado' },
    { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter'], answer: 'Mars' },
    { q: "In 'The Wizard of Oz,' what is the name of Dorothy's little dog?", options: ['Toto', 'Rex', 'Buddy'], answer: 'Toto' },
    { q: 'Which city is famous for its Golden Gate Bridge?', options: ['New York', 'San Francisco', 'Chicago'], answer: 'San Francisco' },
    { q: 'Acorns grow on which kind of tree?', options: ['Oak', 'Pine', 'Maple'], answer: 'Oak' },
    { q: "Who famously sang 'White Christmas'?", options: ['Frank Sinatra', 'Bing Crosby', 'Elvis Presley'], answer: 'Bing Crosby' },
    { q: 'What is the largest state in the United States?', options: ['Texas', 'Alaska', 'California'], answer: 'Alaska' },
    { q: 'Which ingredient makes bread dough rise?', options: ['Salt', 'Yeast', 'Butter'], answer: 'Yeast' },
    { q: 'What river carved the Grand Canyon?', options: ['The Mississippi', 'The Colorado', 'The Missouri'], answer: 'The Colorado' },
    { q: 'Which lively dance was all the rage in the 1920s?', options: ['The Waltz', 'The Charleston', 'The Tango'], answer: 'The Charleston' },
    { q: 'How many strings does a violin have?', options: ['Four', 'Six', 'Eight'], answer: 'Four' },
    { q: 'Which ocean lies between America and Europe?', options: ['The Pacific', 'The Atlantic', 'The Indian'], answer: 'The Atlantic' },
    { q: 'What is a group of lions called?', options: ['A pride', 'A pack', 'A herd'], answer: 'A pride' },
    { q: 'Which pie is a Thanksgiving tradition?', options: ['Pumpkin', 'Lemon meringue', 'Key lime'], answer: 'Pumpkin' },
  ],
  3: [
    { q: 'Who painted the Mona Lisa?', options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso'], answer: 'Leonardo da Vinci' },
    { q: 'What is the longest river in the world?', options: ['The Amazon', 'The Nile', 'The Mississippi'], answer: 'The Nile' },
    { q: 'In what year did World War II end?', options: ['1941', '1945', '1950'], answer: '1945' },
    { q: "Who wrote 'Romeo and Juliet'?", options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen'], answer: 'William Shakespeare' },
    { q: "Who starred as Rick in the film 'Casablanca'?", options: ['Cary Grant', 'Humphrey Bogart', 'James Stewart'], answer: 'Humphrey Bogart' },
    { q: 'Which First Lady was married to Franklin D. Roosevelt?', options: ['Bess Truman', 'Eleanor Roosevelt', 'Mamie Eisenhower'], answer: 'Eleanor Roosevelt' },
    { q: 'What is the capital of Italy?', options: ['Venice', 'Rome', 'Milan'], answer: 'Rome' },
    { q: "Which composer wrote the 'Moonlight Sonata'?", options: ['Mozart', 'Beethoven', 'Bach'], answer: 'Beethoven' },
    { q: 'Scarlett O\'Hara is the heroine of which classic film?', options: ['Rebecca', 'Gone with the Wind', 'Giant'], answer: 'Gone with the Wind' },
    { q: 'What is the tallest mountain in the world?', options: ['Mount McKinley', 'Mount Everest', 'The Matterhorn'], answer: 'Mount Everest' },
    { q: "Who was the nurse known as 'The Lady with the Lamp'?", options: ['Clara Barton', 'Florence Nightingale', 'Betsy Ross'], answer: 'Florence Nightingale' },
    { q: 'Which prized spice comes from the crocus flower?', options: ['Nutmeg', 'Saffron', 'Cloves'], answer: 'Saffron' },
    { q: 'Which president appears on the five-dollar bill?', options: ['Ulysses S. Grant', 'Abraham Lincoln', 'Andrew Jackson'], answer: 'Abraham Lincoln' },
    { q: "Which element has the chemical symbol 'Au'?", options: ['Silver', 'Gold', 'Iron'], answer: 'Gold' },
    { q: 'Julie Andrews played Maria in which beloved musical film?', options: ['My Fair Lady', 'The Sound of Music', 'Oklahoma!'], answer: 'The Sound of Music' },
    { q: 'Which country gave the Statue of Liberty to the United States?', options: ['England', 'France', 'Italy'], answer: 'France' },
  ],
};

const TOTAL_TRIALS = 8;

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function Playfield({ level, finishGame }) {
  // Pre-shuffle the whole pool so no question repeats within a game.
  const queueRef = useRef(null);
  if (!queueRef.current) queueRef.current = shuffled(QUESTIONS_BY_LEVEL[Math.min(level, 3)]);
  const nextQuestionRef = useRef(0);

  const game = useTrialGame({
    totalTrials: TOTAL_TRIALS,
    feedbackMs: 1300,
    makeProblem: () => {
      const queue = queueRef.current;
      const question = queue[nextQuestionRef.current % queue.length];
      nextQuestionRef.current += 1;
      return { ...question, options: shuffled(question.options) };
    },
    finishGame,
  });
  const p = game.problem;
  const [picked, setPicked] = useState(null);

  useEffect(() => setPicked(null), [p]);

  const choose = (option) => {
    setPicked(option);
    game.answer(option === p.answer, `The answer is ${p.answer}`);
  };

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />

      <div
        className="card"
        style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          textAlign: 'center',
          margin: '0 0 var(--spacing-lg)',
          width: '100%',
        }}
      >
        {p.q}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        width: '100%',
        maxWidth: 620,
      }}>
        {p.options.map((option) => (
          <button
            key={option}
            className={
              'choice-btn' +
              (game.locked && option === p.answer ? ' correct'
                : game.locked && option === picked ? ' wrong'
                : '')
            }
            onClick={() => choose(option)}
            disabled={game.locked}
          >
            {option}
          </button>
        ))}
      </div>

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function TriviaTime({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Trivia Time"
      icon="💡"
      category="knowledge"
      level={level}
      instructions={[
        { icon: '❓', text: 'Read the question — take all the time you like.' },
        { icon: '👆', text: 'Tap the answer you think is right.' },
        { icon: '🔥', text: 'Get 3 right in a row for bonus points!' },
      ]}
      tip="Your first instinct is usually the right one."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}

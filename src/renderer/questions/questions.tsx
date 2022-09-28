import React from 'react';

import './questions.css';

const questions = [
  {
    question: 'What is the bug?',
    answers: [
      {
        answer: 'The bug is that the button is not clickable',
      },
      {
        answer: 'The bug is that the button is not visible',
      },
      {
        answer: 'The bug is that the button is not working',
      },
    ],
  },
  {
    question: 'What is the expected behavior?',
    answers: [
      {
        answer: 'The button should be clickable',
      },
      {
        answer: 'The button should be visible',
      },
      {
        answer: 'The button should be working',
      },
    ],
  },
];

const Questions: React.FC<any> = ({ setFinalAnswers }): JSX.Element => {
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState<any[]>([]);
  return (
    <div className="question">
      <h2>{questions[currentQuestion].question}</h2>
      <div className="answers">
        {questions[currentQuestion].answers.map((answer, index) => (
          <div
            className="answer"
            key={`${index + currentQuestion}-${currentQuestion}`}
          >
            <input
              type="radio"
              name="answer"
              value={answer.answer}
              onChange={(e) => {
                setAnswers((prev) => {
                  const newAnswers = [...prev];
                  newAnswers[currentQuestion] = {
                    question: questions[currentQuestion].question,
                    answer: e.target.value,
                  };
                  return newAnswers;
                });
              }}
              id={`${index + currentQuestion}-${currentQuestion}`}
              defaultChecked={
                answers[currentQuestion]?.answer === answer.answer
              }
            />
            <label htmlFor={`${index + currentQuestion}-${currentQuestion}`}>
              {answer.answer}
            </label>
          </div>
        ))}
        <div className="buttons">
          <button
            onClick={() => {
              if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
              } else {
                setFinalAnswers(answers);
              }
            }}
            type="button"
            disabled={answers[currentQuestion] === undefined}
          >
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
          </button>

          {currentQuestion > 0 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              type="button"
            >
              Previous
            </button>
          ) : (
            <div> </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questions;

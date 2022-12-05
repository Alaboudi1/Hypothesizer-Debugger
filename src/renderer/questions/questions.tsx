import React from 'react';

import './Questions.css';

const questions = [
  {
    question: 'Choose one of the below options to describe the bug:',
    answers: [
      {
        answer: 'The bug causes the program to crash.',
      },
      {
        answer: 'The bug causes the program to render the UI incorrectly.',
      },
      {
        answer:
          'The bug causes the program to not respond to clicking or typing.',
      },
    ],
  },
  {
    question: 'What is incorrect about the UI?',
    answers: [
      {
        answer:
          'The style of the UI is incorrect (e.g., color, size, position).',
      },
      {
        answer:
          'The content of the UI is incorrect (e.g., text, image is not correct).',
      },
      {
        answer: 'Both the style and the content of the UI are incorrect.',
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

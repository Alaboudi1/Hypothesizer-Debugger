import { useState, useRef, useEffect } from 'react';
import Recorder from '../recorder/Recorder';
import {
  sendCommand,
  subscribeToCommand,
  removeAllListeners,
} from '../frontendConnectors';
import './App.css';
import icon from './icon.png';
import Spinner from '../loading/spinner';
import Hypotheses from '../hypotheses/hypotheses';
import Questions from '../questions/questions';
import TimeLine from '../timeLine/TimeLine';

const App = (): JSX.Element => {
  const unfiltredHypotheses = useRef([]);
  const targetUrl = useRef<string>('http://localhost:3000');
  const userAnswers = useRef<any[]>([]);
  const futureSteps = useRef<string[]>([
    'Please record your actions while reproducing the bug.',
    'Please answer the following questions.',
    'Please wait while we are analyzing and formulating hypotheses.',
    'We will offer a list potential hypotheses if we found any.',
  ]);
  const doneStepsRef = useRef<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    sendCommand('isDockerRunning');
    subscribeToCommand('isDockerRunning', (isDockerRunning) => {
      if (isDockerRunning) {
        doneStepsRef.current.push('Dev environment is ready!');
        setCurrentStep(1);
        futureSteps.current.shift();
      }
      subscribeToCommand('hypotheses', (hypotheses) => {
        unfiltredHypotheses.current = hypotheses;
        if (userAnswers.current.length > 0) {
          setCurrentStep(4);
          futureSteps.current.shift();
          doneStepsRef.current.push('Analysis is done!');
        }
      });
    });
    sendCommand('launch', { targetUrl: targetUrl.current });
    return () => removeAllListeners();
  }, []);

  const getPotintialHypotheses = () => {
    return unfiltredHypotheses.current;
    // .filter((hypothesis) => hypothesis.score > 0.5)
    // .filter((hypothesis) => {
    //   const { defect_category } = hypothesis;
    //   return (
    //     userAnswers.current[0].answer.includes(defect_category.type) &&
    //     userAnswers.current[1].answer.includes(
    //       defect_category.incorrectOutput
    //     )
    //   );
    // })
    // .sort((a, b) => a.score - b.score);
  };

  const getMainContainer = (): JSX.Element => {
    switch (currentStep) {
      case 0:
        return (
          <div className="mainContainer">
            <div className="notReady addedAnnimation">
              <h1>⚠️ Sorry, Docker is not running on your machine!</h1>
              <p>
                Please install Docker and run the Docker desktop app before
                retrying. for more information please visit:
                <a
                  href="https://docs.docker.com/get-docker/"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://docs.docker.com/get-docker/
                </a>
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="mainContainer">
            <div className="recordContainer addedAnnimation" key={currentStep}>
              <h3>Please record your actions while reproducing the bug.</h3>
              <ol>
                <li>
                  <b>Start recording.</b>
                </li>
                <li>
                  <b>Reproduce the bug.</b> (do the actions that cause the bug.)
                </li>
                <li>
                  <b>Stop recording.</b>
                </li>
              </ol>
              <Recorder
                nextHypothesizerState={() => {
                  setCurrentStep(2);
                  futureSteps.current.shift();
                  doneStepsRef.current.push('Recording is done!');
                }}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="mainContainer">
            <div
              className="questioningContainer addedAnnimation"
              key={currentStep}
            >
              <Questions
                setFinalAnswers={(answers) => {
                  userAnswers.current = answers;
                  setCurrentStep(3);
                  futureSteps.current.shift();
                  doneStepsRef.current.push(
                    `We know that ${answers[0].answer}`
                  );
                  doneStepsRef.current.push(
                    `We also know that ${answers[1].answer}`
                  );
                  if (unfiltredHypotheses.current.length > 0) {
                    setCurrentStep(4);
                    futureSteps.current.shift();
                    doneStepsRef.current.push('Analysis is done!');
                  }
                }}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="mainContainer">
            <div className="addedAnnimation" key={currentStep}>
              <h1>Hypothesizing...</h1>
              <div className="thinking">
                <span>🤔 </span>
                <span>💭</span>
                <Spinner />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="reportContainer addedAnnimation">
            {/* <Hypotheses hypotheses={getPotintialHypotheses()} /> */}
            <TimeLine hypotheses={getPotintialHypotheses()} />
          </div>
        );
      default:
        return <></>;
    }
  };
  return (
    <div className="appContainer">
      <div className="toolsBar">
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
        >
          ⟳
        </button>
        <button type="button" onClick={() => sendCommand('openDevTools')}>
          🐞
        </button>
        {/* <input
          type="text"
          value={targetUrl.current}
          onChange={(e) => {
            targetUrl.current = e.target.value;
          }}
          title="url"
        /> */}
      </div>
      <div className="logo">
        <img src={icon} alt="icon" />
        <p>Hypothesizer</p>
        <p> Your Second Brain Debugger</p>
      </div>
      <ul className="doneSteps" key={currentStep + Math.random()}>
        {doneStepsRef.current.map((step) => (
          <li className="doneStep addedAnnimation" key={step + Math.random()}>
            {step}
          </li>
        ))}
      </ul>
      {getMainContainer()}
      {futureSteps.current.length > 0 && (
        <ul className="nextSteps" key={currentStep + Math.random()}>
          <h3>What is next?</h3>
          {futureSteps.current.map((step) => (
            <li className="nextStep addedAnnimation" key={step + Math.random()}>
              {step}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;

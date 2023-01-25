import { useState, useRef, useEffect } from 'react';
import Recorder from '../recorder/Recorder';
import {
  sendCommand,
  subscribeToCommand,
  removeAllListeners,
} from '../frontendConnectors';
import './App.css';
import Spinner from '../loading/Spinner';
import Hypotheses from '../hypotheses/Hypotheses';
import Tags from '../tags/Tags';

const App = (): JSX.Element => {
  const potentialHypotheses = useRef([]);
  const targetUrl = useRef<string>('http://localhost:3000');
  const futureSteps = useRef<string[]>([
    'Please record your actions while reproducing the bug.',
    'Please wait while we are analyzing and formulating hypotheses.',
    'Please select tags that you think are relevant to the bug.',
    'We will offer a list potential hypotheses if we found any.',
  ]);
  const doneStepsRef = useRef<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const searchButtonRef = useRef<HTMLInputElement>(null);
  const [initSelectedTags, setInitSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchButtonRef.current?.focus();
        searchButtonRef.current?.select();
      }
    });
    sendCommand('isDockerRunning');
    subscribeToCommand('isDockerRunning', (isDockerRunning) => {
      if (isDockerRunning) {
        doneStepsRef.current.push('Dev environment is ready!');
        setCurrentStep(1);
        futureSteps.current.shift();
      }
      subscribeToCommand('hypotheses', (payload) => {
        potentialHypotheses.current = payload;
        if (payload.hypotheses.length > 0) setCurrentStep(3);
        else setCurrentStep(4);
        futureSteps.current.shift();
        doneStepsRef.current.push('Analysis is done!');
      });
    });
    sendCommand('launch', { targetUrl: targetUrl.current });
    return () => removeAllListeners();
  }, []);

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
      case 3:
        return (
          <div className="mainContainer">
            <div className="addedAnnimation" key={currentStep}>
              <h2>How would you describe the bug?</h2>
              <p>
                Please select tag(s) that describe the bug and its behaivor. You
                can change your selection later.
              </p>
              <Tags
                tagsMostLikley={potentialHypotheses.current.hypotheses
                  .filter((hypothesis) => hypothesis.score === 1)
                  .flatMap((hypothesis) => hypothesis.tags)
                  .filter((tag, index, self) => self.indexOf(tag) === index)}
                tagsLessLikley={potentialHypotheses.current.hypotheses
                  .filter(
                    (hypothesis) =>
                      hypothesis.score < 1 && hypothesis.score > 0.5
                  )
                  .flatMap((hypothesis) => hypothesis.tags)
                  .filter((tag, index, self) => self.indexOf(tag) === index)}
                tagsUpdate={(tags) => {
                  setInitSelectedTags(tags);
                }}
                initSelectedTags={[]}
              />
              <button
                className="nextButton"
                onClick={() => {
                  setCurrentStep(4);
                  futureSteps.current.shift();
                  doneStepsRef.current.push('Tags are done!');
                }}
                type="button"
                disabled={initSelectedTags.length === 0}
              >
                Show Hypotheses
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="reportContainer addedAnnimation">
            <Hypotheses
              hypotheses={potentialHypotheses.current.hypotheses}
              initSelectedTags={initSelectedTags}
              linkToProject={potentialHypotheses.current.linkToProject}
            />
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
          style={{ fontSize: '2rem' }}
        >
          ⟳
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
        {/* <img src={icon} alt="icon" />
        <p>Hypothesizer</p>
        <p> Your Second Brain Debugger</p> */}
        {/* search */}
        <div className="search">
          <input
            ref={searchButtonRef}
            type="text"
            placeholder="Search..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendCommand('search', {
                  searchTerm: searchButtonRef.current?.value,
                });
              }
            }}
          />
        </div>
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

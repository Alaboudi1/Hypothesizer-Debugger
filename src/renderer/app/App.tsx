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

const App = (): JSX.Element => {
  const [unfiltredHypotheses, setUnfiltredHypotheses] = useState<any[]>([]);
  const targetUrl = useRef<string>('http://localhost:3000');
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [recordState, setRecordState] = useState<string>('ready');

  useEffect(() => {
    sendCommand('isDockerRunning');
    subscribeToCommand('isDockerRunning', (isDockerRunning) => {
      if (!isDockerRunning) {
        setRecordState('notReady');
      }
      subscribeToCommand('hypotheses', (hypotheses) => {
        setUnfiltredHypotheses(hypotheses);
      });
    });
    return () => removeAllListeners();
  }, [recordState, unfiltredHypotheses]);

  const getPotintialHypotheses = () => {
    return unfiltredHypotheses
      .filter((hypothesis) => hypothesis.score > 0.5)
      .filter((hypothesis) => {
        const { related_defect } = hypothesis;
        return (
          userAnswers[0].answer.includes(related_defect.type) &&
          userAnswers[1].answer.includes(related_defect.incorrectOutput)
        );
      })
      .sort((a, b) => a.score - b.score);
  };

  const getAnalysisAndHypothesesUI = (): JSX.Element => {
    if (userAnswers.length === 0) {
      return (
        <div className="questioningContainer">
          <Questions setFinalAnswers={setUserAnswers} />
        </div>
      );
    }
    if (unfiltredHypotheses.length === 0) {
      return (
        <div className="hypothesesContainer">
          <Spinner text="loading" />
        </div>
      );
    }
    const potentialHypotheses = getPotintialHypotheses();
    return (
      <div className="reportContainer">
        <Hypotheses hypotheses={potentialHypotheses} />
      </div>
    );
  };

  const getMainContainer = (): JSX.Element => {
    switch (recordState) {
      case 'notReady':
        return (
          <div className="notReady">
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
        );

      case 'ready':
        return (
          <div className="startContainer">
            <img src={icon} alt="icon" />
            <h2>Hypothesizer</h2>
            <h4> Your Second Brain Debugger</h4>
            <button
              type="button"
              onClick={() => {
                sendCommand('launch', { targetUrl: targetUrl.current });
                setRecordState('record');
              }}
            >
              Start
            </button>
          </div>
        );
      case 'record':
        return (
          <div className="recordContainer">
            <Recorder nextHypothesizerState={() => setRecordState('done')} />
          </div>
        );
      case 'done':
        return getAnalysisAndHypothesesUI();
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
      <div className="mainContainer">{getMainContainer()}</div>
    </div>
  );
};

export default App;

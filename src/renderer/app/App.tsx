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

type HypothesizerState =
  | 'notReady'
  | 'start'
  | 'record'
  | 'question'
  | 'analyize'
  | 'hypothesize'
  | 'report';

const App = (): JSX.Element => {
  const [hypothesizerState, setHypothesizerState] =
    useState<HypothesizerState>('start');
  const [loadingMessage, setLoadingMessage] = useState<number>(0);

  const trace = useRef<any[]>([]);
  const hypothesesLinks = useRef<string[]>([]);
  const targetUrl = useRef<string>('http://localhost:3000');
  const hypotheses = useRef<any[]>([]);
  const finalAnswer = useRef<any[]>([]);
  const nextHypothesizerState = useRef<HypothesizerState>('analyize');

  const setFinalAnswers = (answers: any): void => {
    finalAnswer.current = answers;
    setHypothesizerState(nextHypothesizerState.current);
  };

  useEffect(() => {
    sendCommand('isDockerRunning');
    subscribeToCommand('finalCoverage', ({ newTrace, link }) => {
      trace.current = newTrace;
      hypothesesLinks.current.push(link as string);
      sendCommand('hypothesize', {
        coverages: newTrace.mergedCoverageMaps,
        knowledgeURL: hypothesesLinks.current,
        files: newTrace.filesContent,
      });
    });

    subscribeToCommand('preparingFinalCoverage', () => {
      if (hypothesizerState === 'question') {
        nextHypothesizerState.current = 'hypothesize';
      } else {
        setHypothesizerState('hypothesize');
      }
    });

    subscribeToCommand('progress', (progress) => {
      setLoadingMessage(progress as number);
    });
    subscribeToCommand('hypotheses', ((hypotheses) => {
      hypotheses.current = hypotheses;
      if (hypothesizerState === 'question') {
        nextHypothesizerState.current = 'report';
      } else {
        setHypothesizerState('report');
      }
    }) as any);
    subscribeToCommand('isDockerRunning', (isDockerRunning) => {
      if (!isDockerRunning) {
        setHypothesizerState('notReady');
      }
    });
    return () => removeAllListeners();
  }, [hypothesizerState]);

  const getMainContainer = (): JSX.Element => {
    switch (hypothesizerState) {
      case 'notReady':
        return (
          <div className="notReady">
            <h1>⚠️ Sorry, Docker is not running on your machine!</h1>
            <p>
              Please install Docker and run the Docker desktop app before
              retrying. for more information please visit:
              <a href="https://docs.docker.com/get-docker/" target="_blank">
                https://docs.docker.com/get-docker/
              </a>
            </p>
          </div>
        );

      case 'start':
        return (
          <div className="startContainer">
            <img src={icon} alt="icon" />
            <h2>Hypothesizer</h2>
            <h4> Your Second Brain Debugger</h4>
            <button
              type="button"
              onClick={() => {
                sendCommand('launch', { targetUrl: targetUrl.current });
                setHypothesizerState('record');
              }}
            >
              Start
            </button>
          </div>
        );
      case 'record':
        return (
          <div className="recordContainer">
            <Recorder
              nextHypothesizerState={() => setHypothesizerState('question')}
            />
          </div>
        );
      case 'question':
        return (
          <div className="questioningContainer">
            <Questions setFinalAnswers={setFinalAnswers} />
          </div>
        );

      case 'analyize':
        return (
          <div className="analyizeContainer">
            <h2>Analyzing</h2>
            <h4>Collecting coverage</h4>
            <div className="loading">
              <progress value={loadingMessage} max="100" />
              <p>{loadingMessage}%</p>
            </div>
          </div>
        );
      case 'hypothesize':
        return (
          <div className="hypothesizeContainer">
            <div className="hypothesesContainer">
              <h2>Hypothesizing</h2>
              <Spinner text="loading" />
            </div>
          </div>
        );
      case 'report':
        return (
          <div className="reportContainer">
            <Hypotheses hypotheses={hypotheses} />
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
      <div className="mainContainer">{getMainContainer()}</div>
    </div>
  );
};

export default App;

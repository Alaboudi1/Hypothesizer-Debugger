import { useState, useRef, useEffect } from 'react';
import Recorder from '../recorder/Recorder';
import { sendCommand, subscribeToCommand } from '../frontendConnectors';
import './App.css';
import icon from './icon.png';
import Timeline from '../timeline/Timelines';
import Spinner from '../loading/spinner';
import Hypotheses from '../hypotheses/hypotheses';
import Questions from '../questions/questions';

type HypothesizerState =
  | 'notReady'
  | 'start'
  | 'record'
  | 'questioning'
  | 'analyize'
  | 'hypothesize'
  | 'report';

const App = (): JSX.Element => {
  const [trace, setTrace] = useState<any[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<number>(0);
  const hypothesesLinks = useRef<string[]>([]);
  const [targetUrl, setTargetUrl] = useState<string>('http://localhost:3000');
  const [hypothesizerState, setHypothesizerState] =
    useState<HypothesizerState>('start');
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const finalAnswer = useRef<any[]>([]);

  const setFinalAnswers = (answers: any): void => {
    finalAnswer.current = answers;
    if (trace.length === 0 && hypothesizerState === 'questioning') {
      setHypothesizerState('analyize');
    } else {
      setHypothesizerState('hypothesize');
    }
  };

  useEffect(() => {
    sendCommand('isDockerRunning');
    subscribeToCommand('finalCoverage', ({ newTrace, link }) => {
      setTrace(newTrace as any[]);
      hypothesesLinks.current.push(link as string);
      sendCommand('hypothesize', {
        coverages: newTrace.mergedCoverageMaps,
        knowledgeURL: hypothesesLinks.current,
        files: newTrace.filesContent,
      });
    });

    subscribeToCommand('preparingFinalCoverage', () => {
      if (finalAnswer.current.length > 0) setHypothesizerState('hypothesize');
    });

    subscribeToCommand('progress', (progress) => {
      setLoadingMessage(progress as number);
    });
    subscribeToCommand('hypotheses', ((hypotheses) => {
      setHypotheses(hypotheses as any[]);
    }) as any);
    subscribeToCommand('isDockerRunning', (isDockerRunning) => {
      if (!isDockerRunning) {
        setHypothesizerState('notReady');
      } else {
        setHypothesizerState('start');
      }
    });
  }, []);

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
                sendCommand('launch', { targetUrl });
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
            <Recorder setHypothesizerState={setHypothesizerState} />
          </div>
        );
      case 'questioning':
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
            {/* <div className="reportContainer">
              <h2>TimeLine</h2>
              <div className="hypotheses">
                {trace.length === 0 ? (
                  <Spinner text="loading" />
                ) : (
                  <Timeline
                    trace={trace.mergedCoverageMaps}
                    filesContent={trace.filesContent}
                  />
                )}
              </div>
            </div> */}

            <div className="hypothesesContainer">
              <h2>Hypotheses</h2>
              {hypotheses.length === 0 ? (
                <Spinner text="loading" />
              ) : (
                <Hypotheses hypotheses={hypotheses} />
              )}
            </div>
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
          value={targetUrl}
          onChange={(e) => {
            setTargetUrl(e.target.value);
          }}
          title="url"
        /> */}
      </div>
      <div className="mainContainer">{getMainContainer()}</div>
    </div>
  );
};

export default App;

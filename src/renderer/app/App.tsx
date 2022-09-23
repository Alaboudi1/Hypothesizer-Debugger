import { useState, useRef, useEffect } from 'react';
import Recorder from '../recorder/Recorder';
import { sendCommand, subscribeToCommand } from '../frontendConnectors';
import './App.css';
import icon from './icon.png';

type HypothesizerState =
  | 'start'
  | 'record'
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

  useEffect(() => {
    subscribeToCommand('finalCoverage', ({ newTrace, link }) => {
      setTrace(newTrace as any[]);
      hypothesesLinks.current.push(link as string);
      setHypothesizerState('hypothesize');
      sendCommand('hypothesize', {
        coverages: newTrace.mergedCoverageMaps,
        knowledgeURL: hypothesesLinks.current,
        files: newTrace.filesContent,
      });
    });
    subscribeToCommand('progress', (progress) => {
      setLoadingMessage(progress as number);
      setHypothesizerState('analyize');
    });
    subscribeToCommand('hypotheses', ((hypotheses) => {
      setHypothesizerState('report');
      setHypotheses(hypotheses as any[]);
    }) as any);
  }, []);

  const getMainContainer = (): JSX.Element => {
    switch (hypothesizerState) {
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
            <Recorder />
            <h5>Click record and then reproduce the bug</h5>
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
            <h2>Hypotheses</h2>
            <div className="spinner">
              <div className="spin" />
              <div className="loading">Hypothesizing</div>
            </div>
          </div>
        );
      case 'report':
        return (
          <div className="reportContainer">
            <h2>Report</h2>
            <h4>Generated hypotheses</h4>
            <div className="hypotheses">
              {hypotheses.map((hypothesis) => (
                <div className="hypothesis">
                  <p>{JSON.stringify(hypothesis)}</p>
                </div>
              ))}
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

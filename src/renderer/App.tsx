import { useState, useEffect, useRef } from 'react';
// import { TimelineItem } from 'react-chrono';
import Recorder from './Recorder';
import './App.css';
import { InformationPanel } from './InformationPanel';

const App = (): JSX.Element => {
  const [trace, setTrace] = useState<any[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<number>(0);
  const hypothesesLinks = useRef<string[]>([]);
  const [targetUrl, setTargetUrl] = useState<string>('http://localhost:3000');

  useEffect(() => {
    window.electron.ipcRenderer.on('CDP', (message) => {
      if (message.command === 'finalCoverage') {
        //split the file url from node_modules or src
        const localHypothesesLink =
          message.payload.filesContent[0].file
            .split('node_modules')
            .reverse()[1] ||
          message.payload.filesContent[0].file.split('src')[0];
        hypothesesLinks.current.push(`${localHypothesesLink}hypotheses.json`);
        setTrace(message.payload);
        console.log(message.payload);
      } else if (message.command === 'progress') {
        setLoadingMessage(message.payload);
      } else if (message.command === 'hypotheses') {
        console.log(message.payload);
      }
    });
  }, []);

  const getRecorder = (): JSX.Element => {
    return (
      <>
        <Recorder />
      </>
    );
  };

  const getMainContainer = (): JSX.Element => {
    if (trace.length === 0) {
      return (
        <>
          {getRecorder()}
          {loadingMessage > 0 && (
            <div className="loading-message">
              {loadingMessage}%
              <progress value={loadingMessage} max={100} />
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              window.electron.ipcRenderer.sendMessage('CDP', {
                command: 'launch',
                payload: { targetUrl },
              })
            }
          >
            start
          </button>{' '}
        </>
      );
    }
    return (
      <>
        <button
          type="button"
          onClick={() =>
            window.electron.ipcRenderer.sendMessage('CDP', {
              command: 'hypothesize',
              payload: {
                coverages: trace.mergedCoverageMaps,
                files: trace.filesContent,
                knowledgeURL: hypothesesLinks.current,
              },
            })
          }
        >
          hypothesize
        </button>
      </>
    );
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
          Refresh
        </button>
        <button
          type="button"
          onClick={() => {
            window.electron.ipcRenderer.sendMessage('CDP', {
              command: 'openDevTools',
            });
          }}
        >
          devtools
        </button>
        <input
          type="text"
          value={targetUrl}
          onChange={(e) => {
            setTargetUrl(e.target.value);
          }}
          title="url"
        />
      </div>
      <div className="mainContainer">{getMainContainer()}</div>
    </div>
  );
};

export default App;

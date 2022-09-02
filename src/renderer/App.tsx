import { useState, useEffect, useRef } from 'react';
// import { TimelineItem } from 'react-chrono';
import Recorder from './Recorder';
import './App.css';
import { InformationPanel } from './InformationPanel';

const App = (): JSX.Element => {
  const [trace, setTrace] = useState<any[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<number>(0);
  const hypothesesLinks = useRef<string[]>([]);
  useEffect(() => {
    window.electron.ipcRenderer.on('CDP', (message) => {
      if (message.command === 'finalCoverage') {
        const localHypothesesLink = getHypothesesLocalURL(
          message.payload.files
        );
        if (localHypothesesLink) {
          hypothesesLinks.current.push(localHypothesesLink);
        }
        setTrace(message.payload);
        console.log(message.payload);
      } else if (message.command === 'progress') {
        setLoadingMessage(message.payload);
      } else if (message.command === 'hypotheses') {
        console.log(message.payload);
      }
    });
  }, []);
  const getHypothesesLocalURL = (files): string | undefined => {
    let url;
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      const { sources } = file.map;
      // eslint-disable-next-line no-restricted-syntax
      for (const source of sources) {
        const node_modules_Index = source.indexOf('node_modules');
        if (node_modules_Index !== -1) {
          url = source.substring(0, node_modules_Index);
          break;
        }
        if (url) {
          break;
        }
      }
    }

    return url;
  };

  const getRecorder = (): JSX.Element => {
    return <Recorder />;
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
              payload: hypothesesLinks.current,
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
      </div>
      <div className="mainContainer">{getMainContainer()}</div>
    </div>
  );
};

export default App;

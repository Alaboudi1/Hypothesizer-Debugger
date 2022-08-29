import { useState } from 'react';
// import { TimelineItem } from 'react-chrono';
import Recorder from './Recorder';
import './App.css';
import { InformationPanel } from './InformationPanel';
import { useEffect } from 'react';

const App = (): JSX.Element => {
  const [trace, setTrace] = useState<any[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  useEffect(() => {
    window.electron.ipcRenderer.on('CDP', (message) => {
      if (message.command === 'finalCoverage') {
        setTrace(message.payload);
        console.log(message.payload);
      } else if (message.command === 'progress') {
        setLoadingMessage(message.payload);
      }
    });
  }, []);
  const getRecorder = (): JSX.Element => {
    return <Recorder />;
  };

  const getMainContainer = (): JSX.Element => {
    if (trace.length === 0) {
      return (
        <>
          {getRecorder()}
          {loadingMessage}
        </>
      );
    }
    return (
      <>
        {trace.map((item: any, index: number) => (
          <div key={Math.random()}>{item.type}</div>
        ))}
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
      </div>
      <div className="mainContainer">{getMainContainer()}</div>
    </div>
  );
};

export default App;

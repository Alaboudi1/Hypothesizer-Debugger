import { useState } from 'react';
// import { TimelineItem } from 'react-chrono';
import Recorder from './Recorder';
import './App.css';
import { InformationPanel } from './InformationPanel';

const App = (): JSX.Element => {
  const [trace, setTrace] = useState<any[]>([]);

  const getRecorder = (): JSX.Element => {
    return (
      <Recorder
        setMethodCoverage={(rawTrace: any[]) => {
          console.log(rawTrace);
          setTrace(rawTrace);
        }}
      />
    );
  };

  const getMainContainer = (): JSX.Element => {
    if (trace.length === 0) {
      return <>{getRecorder()}</>;
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

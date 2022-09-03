import React, { useEffect } from 'react';
import './Recorder.css';
import { getCoverage } from '../scripts/coverage';
import { ProfilerOutput, TemporaryEventType } from '../types/RawCoverageTypes';
import { TraceWithMapping } from '../types/finalTypes';

type recordState = 'ideal' | 'record' | 'collect';

const Recorder: React.FC<RecorderProps> = ({
  targetUrl,
}): React.ReactElement => {
  const [recordState, setRecordingState] = React.useState<recordState>('ideal');
  const events = React.useRef<TemporaryEventType[]>([]);

  const recorder = async (recordState: recordState): Promise<void> => {
    if (recordState === 'record') {
      setRecordingState(recordState);
      window.electron.ipcRenderer.sendMessage('CDP', {
        command: 'record',
        payload: { targetUrl },
      });
    } else if (recordState === 'collect') {
      setRecordingState(recordState);
      window.electron.ipcRenderer.sendMessage('CDP', {
        command: 'stopRecording',
      });
      setRecordingState('ideal');
    }
  };

  const getButton = (): JSX.Element => {
    switch (recordState) {
      case 'ideal':
        return (
          <button onClick={() => recorder('record')} type="button">
            Record
          </button>
        );
      case 'record':
        return (
          <button
            onClick={() => recorder('collect')}
            id="recording"
            type="button"
          >
            Recording
          </button>
        );
      case 'collect':
        return <button type="button">Collecting</button>;
      default:
        return <></>;
    }
  };

  return <div className="record">{getButton()}</div>;
};

export default Recorder;

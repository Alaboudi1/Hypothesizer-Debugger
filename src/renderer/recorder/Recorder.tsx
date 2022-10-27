import React from 'react';
import './Recorder.css';
import { sendCommand } from '../frontendConnectors';

type RecordState = 'ideal' | 'record' | 'collect';

const Recorder: React.FC = ({ nextHypothesizerState }): React.ReactElement => {
  const [recordState, setRecordingState] = React.useState<RecordState>('ideal');

  const recorder = async (newRecordState: RecordState): Promise<void> => {
    if (newRecordState === 'record') {
      setRecordingState(newRecordState);
      sendCommand('record');
    } else if (newRecordState === 'collect') {
      setRecordingState(newRecordState);
      sendCommand('stopRecording');
      nextHypothesizerState();
    }
  };

  const getButton = (): JSX.Element => {
    switch (recordState) {
      case 'ideal':
        return (
          <button
            onClick={() => recorder('record')}
            type="button"
            title="Click record and then reproduce the bug"
          >
            Start REC
          </button>
        );
      case 'record':
        return (
          <button
            onClick={() => recorder('collect')}
            id="recording"
            type="button"
          >
            <p className="stopRecording" />
            Stop REC
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

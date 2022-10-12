import { ipcMain } from 'electron';
import { record, stopRecording, launchBrowser } from './trace/mainTrace';
import { getEvidance, getHypotheses } from './analyzer/mainAnalyzer';
import getCoverage from './sourceMap/mainSourceMap';

type SetupWindow = (
  width: number,
  height: number,
  onTop: boolean,
  xPosition: number,
  yPosition: number
) => void;

const initConnector = (
  setupWindow: SetupWindow,
  setupDevTools: () => void,
  getMainWindowPositions: () => number[],
  isDockerRunning: () => boolean
) => {
  // let target = undefined;
  let x = 0;
  let y = 0;
  const setuplisteners = () => {
    ipcMain.on('CDP', async (event, arg) => {
      const notifyFrontend = (channel: string, args: any) => {
        event.sender.send('CDP', {
          command: channel,
          payload: args,
        });
      };
      const setBackendState = ({ payload, step }) => {
        switch (step) {
          case 'trace':
            getEvidance(
              payload.trace.mergedCoverageMaps,
              payload.trace.filesContent,
              [payload.linkToKnowledge],
              setBackendState
            );
            break;
          case 'evidance':
            getHypotheses(payload.evidance, payload.knowledge, setBackendState);
            break;
          case 'hypotheses':
            notifyFrontend('hypotheses', payload);
            break;
          default:
            throw new Error('Unknown step');
        }
      };

      if (arg.command === 'launch') {
        // set the x and y position of the window to bottom right
        [x, y] = getMainWindowPositions();

        setupWindow(70, 125, true, 0, 0);
        await launchBrowser(arg.payload.targetUrl);
      }
      if (arg.command === 'record') {
        await record();
      }
      if (arg.command === 'stopRecording') {
        notifyFrontend('progress', 0);
        const { coverage, files } = await stopRecording();
        setupWindow(1024, 728, false, x, y);
        getCoverage(coverage, files, setBackendState);
      }
      if (arg.command === 'openDevTools') {
        setupDevTools();
      }

      if (arg.command === 'isDockerRunning') {
        notifyFrontend('isDockerRunning', isDockerRunning());
      }
    });
  };

  setuplisteners();
};

export default initConnector;
function send(arg0: string, arg1: number) {
  throw new Error('Function not implemented.');
}

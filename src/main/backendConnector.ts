import { ipcMain } from 'electron';
import { record, stopRecording, launchBrowser } from './trace/mainTrace';
import getHypotheses from './analyzer/mainAnalyzer';
import getCoverage from './sourceMap/mainSourceMap';

type SetupWindow = (
  width: number,
  height: number,
  onTop: boolean,
  xPosition: number,
  yPosition: number
) => void;

const initConnector = (setupWindow: SetupWindow, setupDevTools: () => void) => {
  // let target = undefined;

  const setuplisteners = () => {
    ipcMain.on('CDP', async (event, arg) => {
      const send = (channel: string, args: any) => {
        event.sender.send('CDP', {
          command: channel,
          payload: args,
        });
      };

      if (arg.command === 'launch') {
        // set the x and y position of the window to bottom right

        setupWindow(110, 250, true, 0, 0);
        await launchBrowser(arg.payload.targetUrl);
      }
      if (arg.command === 'record') {
        await record();
      }
      if (arg.command === 'stopRecording') {
        const { coverage, files } = await stopRecording();
        setupWindow(1024, 728, false, 300, 300);
        getCoverage(coverage, files, send);
      }
      if (arg.command === 'openDevTools') {
        setupDevTools();
      }
      if (arg.command === 'hypothesize') {
        getHypotheses(
          arg.payload.coverages,
          arg.payload.files,
          arg.payload.knowledgeURL,
          send
        );
      }
    });
  };

  setuplisteners();
};

export default initConnector;

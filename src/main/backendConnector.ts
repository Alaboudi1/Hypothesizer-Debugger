import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { record, stopRecording, launchBrowser } from './trace/recorder';
import { getEvidence, getHypotheses } from './analyzer/mainAnalyzer';
import getCoverage from './sourceMap/mainSourceMap';

// this connects the backend to the frontend
// The first command is to check if the docker is running, the frontend sends this command on startup
// The second command is to launch the browser, the frontend sends this command when the docker is running
// The third command is to record the trace, the frontend sends this command when the user clicks on the record button
// The fourth command is to stop the recording, the frontend sends this command when the user clicks on the stop button
// after the recording is stopped, the frontend sends the trace to the backend to analyze it
// To analyze the trace, the backend first devide the trace to x number of arrays (currently 20) inside sourceMap/mainSourceMap.ts
// For each array, the backend spawns a new worker to do the mapping inside sourceMap/sourceMapping.js
// After the mapping is done, the backend clean the data inside sourceMap/coverageCleaning.js most of the cleaning is done to the function coverage
// After the cleaning is done, the backend sends the data to analyzer to run the queries inside analyzer/mainAnalyzer.ts
// the first setp is to write the queries and the trace to files inside analyzer/src
// the second step is to run the queries inside analyzer/src using semgrep with python and docker
// the third step is to write the results to files inside analyzer/src/output
// Finally, the result files are read by reasoninAboutEvidence.js and sent to the frontend

const initConnector = (
  setupDevTools: () => void,
  getMainWindowPositions: () => { width: number; height: number },
  isDockerRunning: () => boolean,
  searchInPage: (searchTerm: string) => void,
  focusOnMainWindow: (flag: boolean) => void
) => {
  const setuplisteners = () => {
    ipcMain.on('CDP', async (event, arg) => {
      const notifyFrontend = (channel: string, args: any) => {
        event.sender.send('CDP', {
          command: channel,
          payload: args,
        });
      };
      const readFromCache = () => {
        try {
          const data = fs.readFileSync(
            path.join(__dirname, 'cache.json'),
            'utf8'
          );
          notifyFrontend('hypotheses', JSON.parse(data));
          return true;
        } catch (error) {
          return false;
        }
      };

      const writeToCache = (data: any) => {
        fs.writeFileSync(
          path.join(__dirname, 'cache.json'),
          JSON.stringify(data)
        );
      };
      const setBackendState = ({ payload, step }) => {
        switch (step) {
          case 'trace':
            getEvidence(
              payload.trace,
              payload.filesContent,
              [payload.linkToKnowledge],
              setBackendState
            );
            break;
          case 'evidence':
            getHypotheses(
              payload.evidence,
              payload.knowledge,
              payload.files,
              setBackendState
            );
            break;
          case 'hypotheses': {
            // writeToCache(payload);
            notifyFrontend('hypotheses', payload);
            break;
          }
          default:
            throw new Error('Unknown step');
        }
      };
      const { command, payload } = arg;
      switch (command) {
        case 'launch': {
          const { width, height } = getMainWindowPositions();
          await launchBrowser(payload.targetUrl, width, height);
          focusOnMainWindow(true);
          break;
        }

        case 'record': {
          // if (!readFromCache()) {
          await record();
          focusOnMainWindow(false);
          // }
          break;
        }

        case 'stopRecording': {
          const { coverage, files } = await stopRecording();
          getCoverage(coverage, files, setBackendState);
          break;
        }

        case 'openDevTools':
          setupDevTools();
          break;

        case 'search':
          searchInPage(payload.searchTerm);
          break;

        case 'isDockerRunning':
          notifyFrontend('isDockerRunning', isDockerRunning());
          break;

        default:
          throw new Error('Unknown command');
      }
    });
  };

  setuplisteners();
};

export default initConnector;

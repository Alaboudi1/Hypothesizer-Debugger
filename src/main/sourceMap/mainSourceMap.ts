import path from 'path';
import { Worker } from 'worker_threads';

const devideCoverage = (coverage: any, divs: number) => {
  const coverageDivs = [];
  for (let i = 0; i < divs; i++) {
    coverageDivs.push(
      coverage.slice(
        i * (coverage.length / divs),
        (i + 1) * (coverage.length / divs)
      )
    );
  }
  return coverageDivs;
};

const getCoverage = (coverage, files, setBackendState) => {
  const divs = 20;
  const trace: any[] = [];

  const workerCallback = (message) => {
    trace.push(message.payload);
    if (trace.length === divs) {
      new Worker(path.join(__dirname, 'coverageCleaning.js'), {
        workerData: {
          coverages: trace.flat(),
          files,
        },
      }).on('message', ({ result }) => {
        const localHypothesesLink = result.projectLink?.split(
          /node_modules|src|webpack/
        )[0];

        setBackendState({
          payload: {
            trace: result.data,
            filesContent: result.filesContent,
            // linkToKnowledge: `${localHypothesesLink}hypotheses.json`,
            linkToKnowledge: `/Users/abdulaziz/Documents/projects/modernWebApplicationBugs/hypotheses.json`,
          },
          step: 'trace',
        });
      });
    }
  };

  const coverageDivs = devideCoverage(coverage, divs);

  coverageDivs.map((record, i) => {
    return new Worker(path.join(__dirname, 'sourceMapping.js'), {
      workerData: { record, files, index: i },
    }).on('message', workerCallback);
  });
};

export default getCoverage;

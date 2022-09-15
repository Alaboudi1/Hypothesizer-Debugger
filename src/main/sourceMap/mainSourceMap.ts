import path from 'path';
import { Worker } from 'worker_threads';
import constrcutTimeLine from './coverageCleaning';
const getTotalCoverage = (coverage) =>
  coverage.flatMap((c) => {
    if (c.type !== 'codeCoverage') {
      return c;
    }
    return c.coverage.flatMap((i) => i.functions);
  }).length;

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

const getCoverage = (coverage, files, callback) => {
  const divs = 10;
  const results: any[] = [];

  let progress = 0;
  const totalCoverage = getTotalCoverage(coverage);

  const workerCallback = (message) => {
    if (message.command === 'finalCoverage') {
      if (results.length < divs - 1) {
        results.push(message.payload);
      } else {
        results.push(message.payload);
        const coverages = results.flat().sort((a, b) => {
          return a.index - b.index || a.timeStamp - b.timeStamp;
        });
        const cleanedCode = constrcutTimeLine(coverages, files);

        callback(message.command, cleanedCode);
      }
    } else if (message.command === 'progress') {
      progress += 1;
      callback(message.command, ((progress / totalCoverage) * 100).toFixed(0));
    }
  };

  const coverageDivs = devideCoverage(coverage, divs);
  const workers = coverageDivs.map((coverage, i) => {
    return new Worker(path.join(__dirname, 'sourceMapping.js'), {
      workerData: { record: coverage, files, index: i },
    });
  });

  workers.forEach((worker) => worker.on('message', workerCallback));
};

export default getCoverage;

import path from 'path';
import { Worker } from 'worker_threads';

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
  const divs = 20;
  const results: any[] = [];

  let progress = 0;
  const totalCoverage = getTotalCoverage(coverage);

  const workerCallback = (message) => {
    if (message.command === 'finalCoverage') {
      if (results.length < divs - 1) {
        results.push(message.payload);
      } else {
        callback('progress', 100);
        results.push(message.payload);
        callback('preparingFinalCoverage');
        new Worker(path.join(__dirname, 'coverageCleaning.js'), {
          workerData: {
            coverages: results,
            files,
          },
        }).on('message', (message) => {
          if (message.command === 'finalCoverage') {
            const linkPath = message.result.filesContent[0].file;
            const localHypothesesLink = linkPath.split(
              /node_modules|src|webpack/
            )[0];

            callback(message.command, {
              newTrace: message.result,
              link: `${localHypothesesLink}hypotheses.json`,
            });
          }
          if (message.command === 'progress') {
            callback(message.command, message.payload);
          }
        });
      }
    } else if (message.command === 'progress') {
      progress += 1;
      callback(message.command, ((progress / totalCoverage) * 100).toFixed(0));
    }
  };

  const coverageDivs = devideCoverage(coverage, divs);
  coverageDivs.map((coverage, i) => {
    return new Worker(path.join(__dirname, 'sourceMapping.js'), {
      workerData: { record: coverage, files, index: i },
    }).on('message', workerCallback);
  });
};

export default getCoverage;

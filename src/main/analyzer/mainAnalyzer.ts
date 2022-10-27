import path from 'path';
import { Worker } from 'worker_threads';

const getEvidance = (coverages, files, knowledgeURL, callback) => {
  const worker = new Worker(path.join(__dirname, 'analyzingEvidence.js'), {
    workerData: {
      coverages,
      files,
      knowledgeURL,
    },
  });

  worker.on('message', (message) => {
    callback({ payload: message, step: 'evidance' });
  });
};

const getHypotheses = (gatheredEvidence, knowledgeMap, callback) => {
  const worker = new Worker(path.join(__dirname, 'reasoningAboutEvidance.js'), {
    workerData: {
      gatheredEvidence,
      knowledgeMap,
    },
  });

  worker.on('message', (message) =>
    callback({ payload: message, step: 'hypotheses' })
  );
};

export { getEvidance, getHypotheses };

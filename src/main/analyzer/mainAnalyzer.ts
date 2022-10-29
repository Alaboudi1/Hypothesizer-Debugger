import path from 'path';
import { Worker } from 'worker_threads';

const getEvidence = (coverages, files, knowledgeURL, callback) => {
  const worker = new Worker(path.join(__dirname, 'analyzingEvidence.js'), {
    workerData: {
      coverages,
      files,
      knowledgeURL,
    },
  });

  worker.on('message', (message) => {
    callback({ payload: message, step: 'evidence' });
  });
};

const getHypotheses = (gatheredEvidence, knowledgeMap, files, callback) => {
  const worker = new Worker(path.join(__dirname, 'reasoningAboutEvidence.js'), {
    workerData: {
      gatheredEvidence,
      knowledgeMap,
      files,
    },
  });

  worker.on('message', (message) =>
    callback({ payload: message, step: 'hypotheses' })
  );
};

export { getEvidence, getHypotheses };

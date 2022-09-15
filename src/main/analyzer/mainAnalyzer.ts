import path from 'path';
import { Worker } from 'worker_threads';

const getHypotheses = (coverages, files, knowledgeURL, callback) => {
  const worker = new Worker(path.join(__dirname, 'hypotheses.js'), {
    workerData: {
      coverages,
      files,
      knowledgeURL,
    },
  });

  worker.on('message', (message) => {
    if (message.command === 'hypotheses') {
      callback(message.command, message.payload);
    }
  });
};

export default getHypotheses;

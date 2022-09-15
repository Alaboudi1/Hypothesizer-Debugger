const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parentPort, workerData } = require('worker_threads');
const { SourceMapConsumer } = require('source-map');

const getKnowledgeFromURL = async (url) => {
  const response = await axios.get(url);
  return response.data;
};

const getKnowledgeFromLocalFile = async (url) => {
  const response = await fs.readFile(path.join(url, 'hypotheses.json'), 'utf8');
  return response;
};

const cleanUpInputsAndOutputsFoler = () => {
  execSync(`rm -rf ${path.join(__dirname, 'src', 'inputs', '*')}`);
  execSync(`rm -rf ${path.join(__dirname, 'src', 'outputs', '*')}`);
};

const getKnowledge = (urls) => {
  const knowledge = urls.map((url) => {
    if (url.startsWith('http')) {
      return getKnowledgeFromURL(url);
    }
    return getKnowledgeFromLocalFile(url);
  });
  return Promise.all(knowledge);
};

const writeCoverageToFiles = (data) => {
  const coverage = data.map((item) => {
    return item.values.codeCoverage.map((coverage) => {
      const { file, functions } = coverage;
      const functionsCoverage = functions.map(
        (functionItem) => functionItem.functionName
      );
      return {
        file,
        functionsCoverage,
      };
    });
  });
  coverage.forEach((item, i) => {
    // fomat the json
    fs.writeFileSync(
      path.join(__dirname, 'src', 'inputs', `coverageCode${i}.json`),
      JSON.stringify(item, null, 2)
    );
  });
};

const semgrepAnalysis = () => {
  try {
    const localPath = path.join(__dirname, 'src', ':/src');
    execSync(
      `docker run --rm -v  ${localPath} returntocorp/semgrep python3 analyzer.py`
    );
    return true;
  } catch (error) {
    return false;
  }
};

const getHypotheses = (coverages, files, knowledgeURL) => {
  // TODO: fetch from knowledge url and then write to src/semgrep_rules/*.yaml
  cleanUpInputsAndOutputsFoler();
  writeCoverageToFiles(coverages);
  semgrepAnalysis();
};
const payload = getHypotheses(
  workerData.coverages,
  workerData.files,
  workerData.knowledgeURL
);
parentPort.postMessage({
  command: 'hypotheses',
  payload,
});

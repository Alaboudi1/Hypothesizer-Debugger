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

const clearInputsAndOutputs = () => {
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';
  const isWindows = process.platform === 'win32';
  if (isMac || isLinux) {
    parentPort.postMessage({
      command: 'hypotheses',
      payload: [isMac, isLinux, isWindows],
    });
    const ins = execSync(`rm -rf ${path.join(__dirname, 'src', 'inputs')}/*`);
    const outs = execSync(`rm -rf ${path.join(__dirname, 'src', 'outputs')}/*`);
    parentPort.postMessage({
      command: 'hypotheses',
      payload: [ins.toString(), outs.toString()],
    });
  } else if (isWindows) {
    execSync(`rmdir /s /q ${path.join(__dirname, 'src', 'inputs')}`);
    execSync(`rmdir /s /q ${path.join(__dirname, 'src', 'outputs')}`);
    execSync(`mkdir ${path.join(__dirname, 'src', 'inputs')}`);
    execSync(`mkdir ${path.join(__dirname, 'src', 'outputs')}`);
  }
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
    const localPath = `${path.join(__dirname, 'src')}:/src`;
    const t = execSync(
      `docker run --rm -v  ${localPath} returntocorp/semgrep python3 analyzer.py`
    );
    parentPort.postMessage({
      command: 'hypotheses',
      payload: [localPath, t.toString()],
    });
    return true;
  } catch (error) {
    parentPort.postMessage({
      command: 'hypotheses',
      payload: [error],
    });
    return false;
  }
};

// read all files in src/outputs and then save it to a json file
const readSemgrepOutput = () => {
  const files = fs.readdirSync(path.join(__dirname, 'src', 'outputs'));
  const semgrepOutput = files.map((file) => {
    const data = fs.readFileSync(
      path.join(__dirname, 'src', 'outputs', file),
      'utf8'
    );
    return { file, data };
  });
  return semgrepOutput;
};

const getHypotheses = async (coverages, files, knowledgeURL) => {
  // TODO: fetch from knowledge url and then write to src/semgrep_rules/*.yaml
  clearInputsAndOutputs();
  writeCoverageToFiles(coverages);
  // const knowledge = await getKnowledge(knowledgeURL);
  semgrepAnalysis();
  const semgrepOutput = readSemgrepOutput();
  parentPort.postMessage({
    command: 'hypotheses',
    payload: semgrepOutput,
  });
};
getHypotheses(workerData.coverages, workerData.files, workerData.knowledgeURL);

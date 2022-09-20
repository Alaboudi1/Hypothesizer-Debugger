const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parentPort, workerData } = require('worker_threads');
const YAML = require('yaml');

const getKnowledgeFromURL = async (url) => {
  const response = await axios.get(url);
  return response.data;
};

const getKnowledgeFromLocalFile = (url) => {
  const response = fs.readFileSync(url, 'utf8');
  return response;
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
    const codeCoverage = item.values.codeCoverage.map((coverage) => {
      const { file, functions } = coverage;
      const functionsCoverage = functions.map(
        (functionItem) => functionItem.functionName
      );
      return {
        file,
        functionsCoverage,
      };
    });
    const UICoverage = item.values.UICoverage.map((coverage) => {
      const { InputType, target, type, keyPressed } = coverage;
      return {
        InputType,
        target,
        type,
        keyPressed,
      };
    });
    const networkCoverage = item.values.networkCoverage.map((coverage) => {
      const { metnod, type, url, mimeType, data } = coverage;
      return {
        metnod,
        type,
        url,
        mimeType,
        data,
      };
    });
    return {
      codeCoverage,
      UICoverage,
      networkCoverage,
    };
  });

  coverage.forEach((item, i) => {
    // fomat the json
    const codeCoverage = JSON.stringify(item.codeCoverage, null, 2);
    const UICoverage = JSON.stringify(item.UICoverage, null, 2);
    const networkCoverage = JSON.stringify(item.networkCoverage, null, 2);
    fs.writeFileSync(
      path.join(
        __dirname,
        'src',
        'inputs',
        'codeCoverage',
        `codeCoverage${i}.js`
      ),
      codeCoverage
    );
    fs.writeFileSync(
      path.join(__dirname, 'src', 'inputs', 'UICoverage', `UICoverage${i}.js`),
      UICoverage
    );
    fs.writeFileSync(
      path.join(
        __dirname,
        'src',
        'inputs',
        'networkCoverage',
        `networkCoverage${i}.js`
      ),
      networkCoverage
    );
  });
};

const clearFiles = () => {
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';
  const isWindows = process.platform === 'win32';
  if (isMac || isLinux) {
    parentPort.postMessage({
      command: 'hypotheses',
      payload: [isMac, isLinux, isWindows],
    });
    execSync(`rm -rf ${path.join(__dirname, 'src', 'outputs')}/*`);
    execSync(
      `rm -rf ${path.join(__dirname, 'src', 'inputs', 'codeCoverage')}/*`
    );
    execSync(`rm -rf ${path.join(__dirname, 'src', 'inputs', 'UICoverage')}/*`);
    execSync(
      `rm -rf ${path.join(__dirname, 'src', 'inputs', 'networkCoverage')}/*`
    );
    execSync(`rm -rf ${path.join(__dirname, 'src', 'semgrep_rules')}/*`);
  } else if (isWindows) {
    execSync(`rmdir /s /q ${path.join(__dirname, 'src', 'inputs')}`);
    execSync(`rmdir /s /q ${path.join(__dirname, 'src', 'outputs')}`);
    execSync(`rmdir /s /q ${path.join(__dirname, 'src', 'semgrep_rules')}`);
    execSync(`mkdir ${path.join(__dirname, 'src', 'inputs')}`);
    execSync(`mkdir ${path.join(__dirname, 'src', 'outputs')}`);
    // create codeCoverage, UICoverage, networkCoverage folders
    execSync(`mkdir ${path.join(__dirname, 'src', 'inputs', 'codeCoverage')}`);
    execSync(`mkdir ${path.join(__dirname, 'src', 'inputs', 'UICoverage')}`);
    execSync(
      `mkdir ${path.join(__dirname, 'src', 'inputs', 'networkCoverage')}`
    );
    execSync(`mkdir ${path.join(__dirname, 'src', 'semgrep_rules')}`);
  }
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
const writeSemgrepRules = (knowledge) => {
  knowledge.forEach((item) => {
    const rules = JSON.parse(item).checks;

    rules.API_calls.forEach((rule) => {
      const yaml = {
        rules: [
          {
            id: rule.id,
            message: rule.id,
            languages: ['js'],
            severity: 'WARNING',
            patterns: [
              {
                pattern: `"${rule.functionName}"\n`,
              },
              {
                'pattern-inside': '"functionsCoverage": [...]\n',
              },
            ],
          },
        ],
      };
      fs.writeFileSync(
        path.join(__dirname, 'src', 'semgrep_rules', `${rule.id}.yml`),
        YAML.stringify(yaml)
      );
    });
    rules.events.forEach((rule) => {
      const yaml = {
        rules: [
          {
            id: rule.id,
            message: rule.id,
            languages: ['js'],
            severity: 'WARNING',
            pattern: JSON.stringify({
              type: rule?.type,
              InputType: rule?.InputType,
            }),
          },
        ],
      };
      fs.writeFileSync(
        path.join(__dirname, 'src', 'semgrep_rules', `${rule.id}.yml`),
        YAML.stringify(yaml)
      );
    });
    rules.network_activites.forEach((rule) => {
      const yaml = {
        rules: [
          {
            id: rule.id,
            pattern: JSON.stringify({
              url: rule?.url,
              type: rule?.type,
              mimeType: rule?.mimeType,
              data: rule?.data,
              method: rule?.method,
            }),
            message: rule.id,
            languages: ['js', 'json'],
            severity: 'WARNING',
          },
        ],
      };
      fs.writeFileSync(
        path.join(__dirname, 'src', 'semgrep_rules', `${rule.id}.yml`),
        YAML.stringify(yaml)
      );
    });
  });
};

const writeCoverageFilesToFiles = (files) => {
  // only if the files are not node_modules
  const filteredFiles = files.filter(
    ({ file }) => file.includes('src') && !file.includes('node_modules')
  );
  filteredFiles.forEach((file, i) => {
    const fileExtension = file.file.split('.').pop();
    fs.writeFileSync(
      path.join(
        __dirname,
        'src',
        'inputs',
        `coverageFiles${i}.${fileExtension}`
      ),
      file.content
    );
  });
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
  const knowledge = await getKnowledge(knowledgeURL);
  clearFiles();
  writeCoverageToFiles(coverages);
  writeCoverageFilesToFiles(files);
  writeSemgrepRules(knowledge);
  // const knowledge = await getKnowledge(knowledgeURL);
  semgrepAnalysis();
  const semgrepOutput = readSemgrepOutput();
  parentPort.postMessage({
    command: 'hypotheses',
    payload: semgrepOutput,
  });
};
getHypotheses(workerData.coverages, workerData.files, workerData.knowledgeURL);

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

const writeCoverageToFiles = (coverage) => {
  // devide the coverage to 50 elements each
  const coverageTyped = {
    codeCoverage: [],
    otherCoverage: [],
  };
  coverage.reduce((acc, curr) => {
    if (curr.type === 'codeCoverage') {
      acc.codeCoverage.push(curr);
    } else {
      acc.otherCoverage.push(curr);
    }
    return acc;
  }, coverageTyped);
  const { codeCoverage, otherCoverage } = coverageTyped;
  const dividedCodeCoverage = [];
  for (let i = 0; i < codeCoverage.length; i += 100) {
    dividedCodeCoverage.push(codeCoverage.slice(i, i + 100));
  }
  dividedCodeCoverage.forEach((item, index) => {
    fs.writeFileSync(
      path.join(__dirname, 'src', 'inputs', 'Code', `coverage${index}.js`),
      JSON.stringify(item, null, 2)
    );
  });
  fs.writeFileSync(
    path.join(__dirname, 'src', 'inputs', 'Events', 'otherCoverage.js'),
    JSON.stringify(otherCoverage, null, 2)
  );
};

const clearFiles = () => {
  const isWindows = process.platform === 'win32';
  const getPath = (...subPath) => path.join(__dirname, 'src', ...subPath);
  if (isWindows) {
    if (fs.existsSync(getPath('outputs')))
      execSync(`rmdir /s /q ${getPath('outputs')}`);

    if (fs.existsSync(getPath('semgrep_rules')))
      execSync(`rmdir /s /q ${getPath('semgrep_rules')}`);

    if (fs.existsSync(getPath('inputs')))
      execSync(`rmdir /s /q ${getPath('inputs')}`);

    execSync(`mkdir ${getPath('inputs')}`);
    execSync(`mkdir ${getPath('outputs')}`);
    execSync(`mkdir ${getPath('inputs', 'Events')}`);
    execSync(`mkdir ${getPath('inputs', 'Code')}`);
    execSync(`mkdir ${getPath('semgrep_rules')}`);
  } else {
    // linux or mac
    if (fs.existsSync(getPath('outputs')))
      execSync(`rm -rf ${getPath('outputs')}`);
    execSync(`mkdir ${getPath('outputs')}`);

    if (fs.existsSync(getPath('semgrep_rules')))
      execSync(`rm -rf ${getPath('semgrep_rules')}`);
    execSync(`mkdir ${getPath('semgrep_rules')}`);

    if (fs.existsSync(getPath('inputs')))
      execSync(`rm -rf ${getPath('inputs')}`);
    execSync(`mkdir ${getPath('inputs')}`);

    execSync(`mkdir ${getPath('inputs', 'Events')}`);
    execSync(`mkdir ${getPath('inputs', 'Code')}`);
  }
};

const semgrepAnalysis = () => {
  try {
    const localPath = `${path.join(__dirname, 'src')}:/src`;
    execSync(
      `docker run --rm -v  ${localPath} returntocorp/semgrep:latest python3 analyzer.py`
    );
    return true;
  } catch (error) {
    parentPort.postMessage({
      command: 'errors',
      payload: [error],
    });
    return false;
  }
};
const writeSemgrepRules = (knowledge) => {
  knowledge.forEach((item) => {
    const rules = item.evidance;

    const APICalls = {
      rules: rules.API_calls.map((rule) => {
        return {
          id: rule.id,
          message: 'call',
          languages: ['js'],
          pattern: JSON.stringify({
            functionName: rule.functionName,
          }),
          severity: 'WARNING',
        };
      }),
    };
    fs.writeFileSync(
      path.join(__dirname, 'src', 'semgrep_rules', 'Code_API_calls.yml'),
      YAML.stringify(APICalls)
    );

    const UIEvents = {
      rules: rules.DOM_events.map((rule) => {
        return {
          id: rule.id,
          languages: ['js'],
          pattern: JSON.stringify({
            type: rule?.type,
            InputType: rule?.InputType,
          }),
          message: 'event',
          severity: 'WARNING',
        };
      }),
    };
    fs.writeFileSync(
      path.join(__dirname, 'src', 'semgrep_rules', 'Events_DOM.yml'),
      YAML.stringify(UIEvents)
    );
    const network = {
      rules: rules.Network_events.map((rule) => {
        return {
          id: rule.id,
          pattern: JSON.stringify({
            url: rule?.url,
            type: rule?.type,
            mimeType: rule?.mimeType,
            data: rule?.data,
            method: rule?.method,
          }),
          message: 'Network event',
          languages: ['js'],
          severity: 'WARNING',
        };
      }),
    };
    fs.writeFileSync(
      path.join(__dirname, 'src', 'semgrep_rules', 'Events_Network.yml'),
      YAML.stringify(network)
    );
    const codePattern = {
      rules: rules.API_calls.map((rule) => {
        if (rule.pattern === undefined || rule.pattern === null) return null;
        return {
          id: rule.id,
          pattern: rule.pattern,
          message: 'pattern',
          languages: ['js'],
          severity: 'WARNING',
        };
      }),
    };
    fs.writeFileSync(
      path.join(__dirname, 'src', 'semgrep_rules', 'Code_pattern.yml'),
      YAML.stringify(codePattern)
    );
  });
};

const writeCoverageFilesToFiles = (files) => {
  files.forEach((file) => {
    fs.writeFileSync(
      path.join(
        __dirname,
        'src',
        'inputs',
        'Code',
        // replace all / or \ with = to avoid errors
        file.file
      ),
      file.content
    );
  });
};

const readSemgrepOutput = () => {
  const files = fs.readdirSync(path.join(__dirname, 'src', 'outputs'));
  return files.flatMap((file) => {
    const content = fs.readFileSync(
      path.join(__dirname, 'src', 'outputs', file),
      'utf8'
    );
    return JSON.parse(content).results.map((result) => {
      return {
        rule: result.check_id,
        file: result.path.split('/')[2].replace(/=/g, '/'),
        lines: [result.start.line, result.end.line],
        message: result.extra.message,
        evidance:
          result.extra.message === 'pattern'
            ? result.extra.lines
            : JSON.parse(result.extra.lines.replace(/,$/, '')),
      };
    });
  });
  // .sort((a, b) => a.evidance.timeStamp - b.evidance.timeStamp);
};

const extractEvidance = (semgrepOutput, files, knowledge) => {
  const patters = semgrepOutput.filter((item) => item.message === 'pattern');
  const evidance = semgrepOutput
    .map((item) => {
      if (item.message === 'call') {
        const pattern = patters.find((pattern) => pattern.rule === item.rule);
        item = {
          ...item,
          evidance: {
            ...item.evidance,
            callee: {
              file: pattern.file,
              lines: pattern.lines,
            },
          },
        };
      }
      return item;
    })
    .filter((item) => item.message !== 'pattern');
  // sort timeStamps from the smallest to the biggest
  return evidance.sort((a, b) => a.evidance.timeStamp - b.evidance.timeStamp);
};

const analyzeEvidence = async (coverages, files, knowledgeURL) => {
  const knowledgeRaw = await getKnowledge(knowledgeURL);
  const knowledge = knowledgeRaw.map((item) => JSON.parse(item));
  clearFiles();
  writeCoverageToFiles(coverages);
  writeCoverageFilesToFiles(files);
  writeSemgrepRules(knowledge);
  semgrepAnalysis();
  const semgrepOutput = readSemgrepOutput();
  const evidance = extractEvidance(semgrepOutput, files, knowledge);
  parentPort.postMessage({
    evidance,
    knowledge,
  });
};
analyzeEvidence(
  workerData.coverages,
  workerData.files,
  workerData.knowledgeURL
);

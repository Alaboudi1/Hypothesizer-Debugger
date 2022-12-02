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
  const dividedOtherCoverage = [];
  for (let i = 0; i < codeCoverage.length; i += 101) {
    dividedCodeCoverage.push(codeCoverage.slice(i, i + 100));
  }
  for (let i = 0; i < otherCoverage.length; i += 100) {
    dividedOtherCoverage.push(otherCoverage.slice(i, i + 100));
  }

  dividedCodeCoverage.forEach((item, index) => {
    fs.writeFileSync(
      path.join(
        __dirname,
        'container',
        'inputs',
        'Code',
        `coverage${index}.js`
      ),
      JSON.stringify(item, null, 2)
    );
  });
  dividedOtherCoverage.forEach((item, index) => {
    fs.writeFileSync(
      path.join(
        __dirname,
        'container',
        'inputs',
        'Events',
        `coverage${index}.js`
      ),
      JSON.stringify(item, null, 2)
    );
  });
  // fs.writeFileSync(
  //   path.join(__dirname, 'container', 'diff', `${Date.now()}Diff.json`),
  //   JSON.stringify(
  //     coverage.sort((a, b) => a.timeStamp - b.timeStamp),
  //     null,
  //     2
  //   )
  // );
};

const clearFiles = () => {
  const isWindows = process.platform === 'win32';
  const getPath = (...subPath) => path.join(__dirname, 'container', ...subPath);
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
    const localPath = `${path.join(__dirname, 'container')}:/src`;
    execSync(
      `docker run --rm -v  ${localPath} returntocorp/semgrep:latest python3 analyzer.py`
      // `python3 ${path.join(__dirname, 'container', 'analyzer.py')}`
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
    const rules = item.evidence;

    const APICalls = {
      rules: rules.API_calls.map((rule) => {
        if (rule.functionName) {
          return {
            id: rule.id,
            message: 'call',
            languages: ['js'],
            pattern: JSON.stringify({
              functionName: rule.functionName,
            }),
            severity: 'WARNING',
          };
        }
        return undefined;
      }).filter((item) => item !== undefined),
    };
    fs.writeFileSync(
      path.join(__dirname, 'container', 'semgrep_rules', 'Code_API_calls.yml'),
      YAML.stringify(APICalls)
    );

    const UIEvents = {
      rules: rules.DOM_events.map(({ objectShape, ...rule }) => {
        return {
          id: rule.id,
          languages: ['js'],
          pattern: JSON.stringify(objectShape),
          message: 'event',
          severity: 'WARNING',
        };
      }),
    };
    fs.writeFileSync(
      path.join(__dirname, 'container', 'semgrep_rules', 'Events_DOM.yml'),
      YAML.stringify(UIEvents)
    );
    const network = {
      rules: rules.Network_events.map(({ objectShape, ...rule }) => {
        return {
          id: rule.id,
          pattern: JSON.stringify(objectShape),
          message: 'Network event',
          languages: ['js'],
          severity: 'WARNING',
        };
      }),
    };
    fs.writeFileSync(
      path.join(__dirname, 'container', 'semgrep_rules', 'Events_Network.yml'),
      YAML.stringify(network)
    );
    const codePattern = {
      rules: rules.API_calls.map(({ patterns, ...rule }) => {
        return {
          id: rule.id,
          patterns,
          message: 'pattern',
          languages: ['js'],
          severity: 'WARNING',
        };
      }),
    };
    fs.writeFileSync(
      path.join(__dirname, 'container', 'semgrep_rules', 'Code_pattern.yml'),
      YAML.stringify(codePattern)
    );
  });
};

const writeCoverageFilesToFiles = (files) => {
  files.forEach((file) => {
    fs.writeFileSync(
      path.join(__dirname, 'container', 'inputs', 'Code', file.file),
      file.content
    );
  });
};

const readSemgrepOutput = () => {
  const files = fs.readdirSync(path.join(__dirname, 'container', 'outputs'));
  return files.flatMap((file) => {
    const content = fs.readFileSync(
      path.join(__dirname, 'container', 'outputs', file),
      'utf8'
    );
    return JSON.parse(content).results.map((result) => {
      return {
        rule: result.check_id.split('semgrep_rules.')[1],
        lines: [result.start.line, result.end.line],
        message: result.extra.message,
        evidence:
          result.extra.message === 'pattern'
            ? {
                syntax: result.extra.lines,
                file: `src${result.path.split('src').pop().replace(/=/g, '/')}`,
              }
            : JSON.parse(result.extra.lines.replace(/,$/, '')),
      };
    });
  });
};

const groupPatternWithApiCalls = (semgrepOutput, knowledge) => {
  const API_calls_rules = knowledge
    .flatMap((item) => item.evidence.API_calls)
    .map((item) => ({
      hasPattern: item.patterns !== undefined,
      hasFunctionCall: item.functionName !== undefined,
      rule: item.id,
      foundPattern: semgrepOutput.filter(
        (i) => i.rule === item.id && i.message === 'pattern'
      ),
      foundFunctionCall: semgrepOutput.filter(
        (i) => i.rule === item.id && i.message === 'call'
      ),
    }));

  const evidence = semgrepOutput
    .map((item) => {
      const rule = API_calls_rules.find((rule) => rule.rule === item.rule);
      if (rule === undefined) return item;
      if (rule.hasPattern && rule.hasFunctionCall) {
        if (
          rule.foundPattern.length > 0 &&
          rule.foundFunctionCall.length > 0 &&
          item.message === 'call'
        ) {
          return {
            rule: item.rule,
            evidence: {
              location: rule.foundPattern.map((j) => ({
                lines: j.lines,
                file: j.evidence.file,
              })),
              timeStamp: item.evidence.timeStamp,
              functionName: item.evidence.functionName,
            },
            type: 'API_call_with_pattern',
          };
        }
        return undefined;
      }
      if (rule.hasPattern && !rule.hasFunctionCall) {
        if (rule.foundPattern.length > 0 && item.message === 'pattern') {
          return {
            rule: item.rule,
            evidence: {
              location: {
                file: item.evidence.file,
                lines: item.lines,
                syntax: item.evidence.syntax,
              },
              timeStamp: -1,
            },
            type: 'API_pattern',
          };
        }
        return undefined;
      }
      if (!rule.hasPattern && rule.hasFunctionCall) {
        if (rule.foundFunctionCall.length > 0 && item.message === 'call') {
          return {
            rule: item.rule,
            evidence: {
              functionName: item.evidence.functionName,
              timeStamp: item.evidence.timeStamp,
              count: item.evidence.count,
            },
            type: 'API_call',
          };
        }
        return undefined;
      }
    })
    .filter((item) => item !== undefined);
  return evidence;
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
  const evidence = groupPatternWithApiCalls(semgrepOutput, knowledge);

  parentPort.postMessage({
    evidence,
    knowledge,
    files,
  });
};
analyzeEvidence(
  workerData.coverages,
  workerData.files,
  workerData.knowledgeURL
);

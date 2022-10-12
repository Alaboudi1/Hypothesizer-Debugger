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
      const { InputType, target, type, keyPressed, ID } = coverage;
      return {
        InputType,
        target,
        type,
        keyPressed,
        ID,
      };
    });
    const networkCoverage = item.values.networkCoverage.map((coverage) => {
      const { metnod, type, url, mimeType, data, ID } = coverage;
      return {
        metnod,
        type,
        url,
        mimeType,
        data,
        ID,
      };
    });
    return {
      codeCoverage,
      UICoverage,
      networkCoverage,
    };
  });

  coverage.forEach((item, i) => {
    if (item.codeCoverage.length > 0) {
      const codeCoverage = JSON.stringify(item.codeCoverage, null, 2);
      fs.writeFileSync(
        path.join(
          __dirname,
          'src',
          'inputs',
          'API_calls',
          `codeCoverage${i}.js`
        ),
        codeCoverage
      );
    }
    if (item.UICoverage.length > 0) {
      const UICoverage = JSON.stringify(item.UICoverage, null, 2);
      fs.writeFileSync(
        path.join(__dirname, 'src', 'inputs', 'events', `UICoverage${i}.js`),
        UICoverage
      );
    }
    if (item.networkCoverage.length > 0) {
      const networkCoverage = JSON.stringify(item.networkCoverage, null, 2);
      fs.writeFileSync(
        path.join(
          __dirname,
          'src',
          'inputs',
          'network_activites',
          `networkCoverage${i}.js`
        ),
        networkCoverage
      );
    }
  });
};

const clearFiles = () => {
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';
  const isWindows = process.platform === 'win32';
  const getPath = (...subPath) => path.join(__dirname, 'src', ...subPath);
  if (isMac || isLinux) {
    if (fs.existsSync(getPath('outputs')))
      execSync(`rm -rf ${getPath('outputs')}`);
    execSync(`mkdir ${getPath('outputs')}`);

    if (fs.existsSync(getPath('semgrep_rules')))
      execSync(`rm -rf ${getPath('semgrep_rules')}`);
    execSync(`mkdir ${getPath('semgrep_rules')}`);

    if (fs.existsSync(getPath('inputs')))
      execSync(`rm -rf ${getPath('inputs')}`);
    execSync(`mkdir ${getPath('inputs')}`);

    execSync(`mkdir ${getPath('inputs', 'API_calls')}`);
    execSync(`mkdir ${getPath('inputs', 'events')}`);
    execSync(`mkdir ${getPath('inputs', 'network_activites')}`);
    execSync(`mkdir ${getPath('inputs', 'code_pattern')}`);
  } else if (isWindows) {
    if (fs.existsSync(getPath('outputs')))
      execSync(`rmdir /s /q ${getPath('outputs')}`);

    if (fs.existsSync(getPath('semgrep_rules')))
      execSync(`rmdir /s /q ${getPath('semgrep_rules')}`);

    if (fs.existsSync(getPath('inputs')))
      execSync(`rmdir /s /q ${getPath('inputs')}`);

    execSync(`mkdir ${getPath('inputs')}`);
    execSync(`mkdir ${getPath('outputs')}`);
    execSync(`mkdir ${getPath('inputs', 'API_calls')}`);
    execSync(`mkdir ${getPath('inputs', 'events')}`);
    execSync(`mkdir ${getPath('inputs', 'network_activites')}`);
    execSync(`mkdir ${getPath('inputs', 'code_pattern')}`);
    execSync(`mkdir ${getPath('semgrep_rules')}`);
  }
};

const semgrepAnalysis = () => {
  try {
    const localPath = `${path.join(__dirname, 'src')}:/src`;
    execSync(
      `docker run --rm -v  ${localPath} returntocorp/semgrep python3 analyzer.py`
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
    const rules = JSON.parse(item).checks;

    const APICalls = {
      rules: rules.API_calls.map((rule) => {
        return {
          id: `${rule.id}-API_calls`,
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
        };
      }),
    };
    fs.writeFileSync(
      path.join(__dirname, 'src', 'semgrep_rules', 'API_calls.yml'),
      YAML.stringify(APICalls)
    );

    const UIEvents = {
      rules: rules.events.map((rule) => {
        return {
          id: rule.id,
          message: rule.id,
          languages: ['js'],
          severity: 'WARNING',
          pattern: JSON.stringify({
            type: rule?.type,
            InputType: rule?.InputType,
          }),
        };
      }),
    };
    fs.writeFileSync(
      path.join(__dirname, 'src', 'semgrep_rules', 'events.yml'),
      YAML.stringify(UIEvents)
    );
    const network = {
      rules: rules.network_activites.map((rule) => {
        return {
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
        };
      }),
    };
    fs.writeFileSync(
      path.join(__dirname, 'src', 'semgrep_rules', 'network_activites.yml'),
      YAML.stringify(network)
    );
    const codePattern = {
      rules: [
        ...rules.code_pattern.map((rule) => {
          return {
            id: rule.id,
            patterns: rule.patterns,
            message: rule.id,
            languages: ['js'],
            severity: 'WARNING',
          };
        }),
        ...rules.API_calls.map((rule) => {
          return {
            id: rule.id,
            patterns: [
              {
                'pattern-either': [
                  {
                    pattern: `${rule.functionName}\n`,
                  },
                  {
                    pattern: `${rule.functionName}(...)\n`,
                  },
                  {
                    pattern: `$E.${rule.functionName}()\n`,
                  },
                ],
              },
            ],
            message: rule.id,
            languages: ['js'],
            severity: 'WARNING',
          };
        }),
      ],
    };
    fs.writeFileSync(
      path.join(__dirname, 'src', 'semgrep_rules', 'code_pattern.yml'),
      YAML.stringify(codePattern)
    );
  });
};

const writeCoverageFilesToFiles = (files) => {
  // only if the files are not node_modules
  const filteredFiles = files.filter(
    ({ file }) => file.includes('src') && !file.includes('node_modules')
  );
  filteredFiles.forEach((file) => {
    fs.writeFileSync(
      path.join(
        __dirname,
        'src',
        'inputs',
        'code_pattern',
        file.file.replace(/\//g, '=')
      ),
      file.content
    );
  });
};

const readSemgrepOutput = () => {
  const files = fs.readdirSync(path.join(__dirname, 'src', 'outputs'));
  const semgrepOutput = files.map((file) => {
    const data = fs.readFileSync(
      path.join(__dirname, 'src', 'outputs', file),
      'utf8'
    );
    const result = {
      type: file.replace('.txt', ''),
      data: data
        .split('inputs')
        .splice(1)
        .map((item) => {
          return {
            rule: item.split('\n')[2].trim(),
            file: item.split('\n')[0].trim(),
            data: item
              .split('\n\n')[1]
              .split('\n')
              .map((e) => e.trim().split('┆')),
          };
        }),
    };
    return result;
  });

  return semgrepOutput;
};
const clearFounds = (data) => {
  data[data.length - 1][1] = data[data.length - 1][1].replace(/['",]/g, '');
  if (data.length === 1) {
    return data[0][1];
  }
  const instances = `[${data.map((e) => (e[0] === '⋮' ? '' : e[1])).join('')}]`;
  return JSON.parse(instances);
};

const groupedEventsOnRule = (evidence) =>
  evidence.reduce((acc, item) => {
    const { rule } = item;
    const exist = acc.find((e) => e.rule === rule);
    if (exist) {
      exist.instances.push(item);
    } else {
      acc.push({
        rule,
        instances: [item],
      });
    }
    return acc;
  }, []);
const extractEventsEvidence = (events, filesMap, coverages, knowledgeMap) => {
  const evidence = events.data.map((event) => {
    const { data, file, rule } = event;
    const found = clearFounds(data);
    // find the rule in the knowledge base
    const ruleInKB = knowledgeMap
      .map(({ checks }) => checks.events.find((item) => item.id === rule))
      .pop();
    // find the file in the coverage
    const eventsInCoverage = coverages
      .map((item) =>
        item.values.UICoverage.filter((e) => found.find((f) => f.ID === e.ID))
      )
      .flat();

    return {
      evidance: eventsInCoverage.map((e) => {
        return {
          ...e,
          jsx: {
            fileContent: {
              content: filesMap[e.jsx.fileName],
              file: e.jsx.fileName,
            },
            lineNumber: e.jsx.lineNumber,
          },
        };
      }),
      rule: ruleInKB,
    };
  });
  return groupedEventsOnRule(evidence);
};
const getOriginalPath = (file) => {
  const convertedPath = file.split('/code_pattern/')[1].split('=');
  const OriginalPath = path.join('~', ...convertedPath).substr(1);
  return OriginalPath;
};
const extractAPICallsEvidence = (
  APICalls,
  filesMap,
  coverages,
  code_pattern,
  knowledgeMap
) => {
  const evidence = APICalls.data.map((APICall) => {
    const { data, file, rule } = APICall;
    const found = clearFounds(data);

    const instances = code_pattern.data.filter((code) => code.rule === rule);
    const ruleInKB = knowledgeMap
      .map(({ checks }) => checks.API_calls.find((item) => item.id === rule))
      .pop();
    const originalFiles = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'src', 'inputs', file), 'utf8')
    ).filter((item) => item.functionsCoverage.indexOf(found) > -1);
    const fileContent = instances.map((instance) => {
      const OriginalPath = getOriginalPath(instance.file);
      const content = filesMap[OriginalPath];
      return {
        file: OriginalPath,
        content,
      };
    });

    return {
      evidance: {
        originalFiles: originalFiles.map((item) => item.file),
        instances: instances.map((instance) => {
          const OriginalPath = getOriginalPath(instance.file);
          return {
            fileContent: fileContent.find((item) => item.file === OriginalPath),
            lineNumber: instance.data.map((e) => e[0]),
            code: instance.data.map((e) => e[1]),
          };
        }),
      },
      rule: ruleInKB,
    };
  });
  return groupedEventsOnRule(evidence);
};
const extractCodePatternEvidence = (
  code_pattern,
  filesMap,
  coverages,
  knowledgeMap
) => {
  return undefined;
};
const extractNetworkEvidence = (
  network_activites,
  filesMap,
  coverages,
  knowledgeMap
) => {
  const evidence = network_activites.data.map((network_activite) => {
    const { data, file, rule } = network_activite;
    const found = clearFounds(data);
    // find the rule in the knowledge base
    const ruleInKB = knowledgeMap
      .map(({ checks }) =>
        checks.network_activites.find((item) => item.id === rule)
      )
      .pop();
    // find the file in the coverage
    const network_activitesInCoverage = coverages
      .map((item) =>
        item.values.networkCoverage.filter((e) =>
          found.find((f) => f.ID === e.ID)
        )
      )
      .flat();
    let assoisatedRequestsForResponses = [];
    if (network_activitesInCoverage.length > 0) {
      const responseReceived = network_activitesInCoverage.filter(
        (e) => e.type === 'responseReceived'
      );
      // get the request of that response
      assoisatedRequestsForResponses = coverages
        .map((item) =>
          item.values.networkCoverage.filter(
            (e) =>
              e.type === 'requestWillBeSent' &&
              responseReceived.find((r) => r.requestId === e.requestId)
          )
        )
        .flat();
    }

    return {
      evidance: {
        network_activites: network_activitesInCoverage,
        assoisatedRequestsForResponses,
      },
      rule: ruleInKB,
    };
  });
  return groupedEventsOnRule(evidence);
};

const extractEvidance = (coverages, semgrepOutput, files, knowledge) => {
  const filesMap = files.reduce((acc, file) => {
    acc[file.file] = file.content;
    return acc;
  }, {});
  const knowledgeMap = knowledge.map((item) => JSON.parse(item));
  const [API_calls, code_pattern, events, network_activites] = semgrepOutput;
  const eventsEvidence =
    extractEventsEvidence(events, filesMap, coverages, knowledgeMap) || [];

  const APIcallsEvidence =
    extractAPICallsEvidence(
      API_calls,
      filesMap,
      coverages,
      code_pattern,
      knowledgeMap
    ) || [];
  const codePatternEvidence =
    extractCodePatternEvidence(
      code_pattern,
      filesMap,
      coverages,
      knowledgeMap
    ) || [];
  const networkEvidence =
    extractNetworkEvidence(
      network_activites,
      filesMap,
      coverages,
      knowledgeMap
    ) || [];
  const gatheredEvidence = [
    ...eventsEvidence,
    ...APIcallsEvidence,
    ...codePatternEvidence,
    ...networkEvidence,
  ];
  return gatheredEvidence;
};

const getEvidance = async (coverages, files, knowledgeURL) => {
  const knowledge = await getKnowledge(knowledgeURL);
  clearFiles();
  writeCoverageToFiles(coverages);
  writeCoverageFilesToFiles(files);
  writeSemgrepRules(knowledge);
  semgrepAnalysis();
  const semgrepOutput = readSemgrepOutput();
  const evidance = extractEvidance(coverages, semgrepOutput, files, knowledge);
  parentPort.postMessage({
    evidance,
    knowledge,
  });
};
getEvidance(workerData.coverages, workerData.files, workerData.knowledgeURL);

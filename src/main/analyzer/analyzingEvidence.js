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
    const rules = JSON.parse(item).evidance;

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
        'Code',
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
        .split('semgrep_rules.')
        .splice(1)
        .map((item) => {
          return {
            file: data.split('\n')[2].trim(),
            rule: item.split('\n')[0].trim(),
            data: item
              .split('\n')
              .splice(1)
              .map((a) =>
                a
                  .split('⋮┆')
                  .map((b) => b.split('\n').filter((c) => c.includes('┆')))
                  .filter((d) => d.length)
              )
              .filter((d) => d.length)
              .flat(2),
          };
        }),
    };
    return result;
  });

  return semgrepOutput;
};
const clearFounds = (data) => {
  if (data[0].includes('{')) {
    const cleanedItem = `[${data
      .map((a) => {
        return a.split('┆')[1].trim();
      })
      .join('')}]`;
    // remove the last comma then parse it
    const cleanedData = JSON.parse(cleanedItem.replace(/,(?=\s*?])/g, ''));
    return cleanedData;
  }
  const cleanedData = `[${data
    .map((e) => {
      const [lineNumber, functionName] = e.split('┆');
      return `{ "lineNumber": ${lineNumber}, "functionName": ${functionName.replace(
        ',',
        ''
      )} }`;
    })
    .join('')}]`;

  return JSON.parse(cleanedData);
};

const groupedEventsOnRule = (evidence) =>
  evidence.reduce((acc, item) => {
    const { rule, evidance } = item;
    const exist = acc.find((e) => e.rule === rule);
    if (exist) {
      exist.instances.push(evidance);
    } else {
      acc.push({
        rule,
        instances: [evidance],
      });
    }
    return acc;
  }, []);
const extractEventsEvidence = (events, filesMap, coverages, knowledgeMap) => {
  const evidence = events.data.map((event) => {
    const { data, rule } = event;
    const found = clearFounds(data);
    // find the rule in the knowledge base
    const ruleInKB = knowledgeMap
      .map(({ evidance }) => evidance.events.find((item) => item.id === rule))
      .pop();
    // find the file in the coverage
    const eventsInCoverage = coverages
      .map((item) =>
        item.values.UICoverage.filter((e) => found.find((f) => f.ID === e.ID))
      )
      .flat();

    return {
      evidance: {
        ...eventsInCoverage,
      },
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
      .map(({ evidance }) =>
        evidance.API_calls.find((item) => item.id === rule)
      )
      .pop();
    const originalFiles = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'src', file), 'utf8')
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
      .map(({ evidance }) =>
        evidance.network_activites.find((item) => item.id === rule)
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
        network_activites: network_activitesInCoverage.pop(),
        assoisatedRequestsForResponses: assoisatedRequestsForResponses.pop(),
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

const analyzeEvidence = async (coverages, files, knowledgeURL) => {
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
analyzeEvidence(
  workerData.coverages,
  workerData.files,
  workerData.knowledgeURL
);

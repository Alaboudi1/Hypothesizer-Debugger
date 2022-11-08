const { parentPort, workerData } = require('worker_threads');

const getFirstAfter = (evidence, evidenceIndex) => {
  const afterEv = evidence.slice(evidenceIndex + 1);

  return (
    afterEv
      .find((ev) => ev.matched.length > 0)
      ?.matched.sort((a, b) => a.evidence.timeStamp - b.evidence.timeStamp) || [
      {
        evidence: {
          timeStamp: Infinity,
        },
      },
    ]
  );
};

const getFirstBefore = (evidence, evidenceIndex) => {
  const beforeEv = evidence.slice(0, evidenceIndex);

  return (
    beforeEv
      .reverse()
      .find((ev) => ev.matched.length > 0)
      ?.matched.sort((a, b) => b.evidence.timeStamp - a.evidence.timeStamp) || [
      { evidence: { timeStamp: -Infinity } },
    ]
  );
};

const reasonAboutEvidence = (gatheredEvidence, knowledgeMap) => {
  // knowledgeMap is an array of knowledge that pulled from multiple sources
  return knowledgeMap.flatMap((knowledgeItem) => {
    // knowledgeItem is a single knowledge source with multiple hypotheses
    return knowledgeItem.hypotheses.map((hypothesis) => {
      // match all gathered evidence to the hypothesis evidence
      let evidence = hypothesis.evidence.map((evidence) => {
        evidence.matched = [];
        gatheredEvidence.forEach((gatheredEvidenceItem, index) => {
          if (gatheredEvidenceItem.rule === evidence.rule) {
            evidence.matched.push(gatheredEvidenceItem);
          }
        });
        return evidence;
      });
      // for each evidence in the hypothesis, check the time stamp if a is after b, then remove a
      evidence = evidence.map((ev, evidenceIndex) => {
        const after = getFirstAfter(evidence, evidenceIndex);
        const before = getFirstBefore(evidence, evidenceIndex);
        return {
          ...ev,
          matched: ev.matched.filter(
            (m) =>
              after.some((a) => m.evidence.timeStamp <= a.evidence.timeStamp) &&
              before.some((b) => m.evidence.timeStamp >= b.evidence.timeStamp)
          ),
        };
      });

      return {
        ...hypothesis,
        evidence,
      };
    });
  });
};

const getStartAndEndLineForJSX = (start, fileContent) => {
  const lines = fileContent.split('\n');
  const startContent = lines[start - 1];
  // does this line contain an opening tag?
  const openingTag = startContent.includes('<');
  let end = start;
  if (openingTag) {
    while (
      end < lines.length &&
      !lines[end - 1].includes('>') &&
      !lines[end - 1].includes('/>')
    ) {
      end += 1;
    }
  }
  return [start, end];
};

const cleanEventKeyPressAndClickEvidence = (events, files) => {
  const cleanedEvent = events.map((event) => {
    const { evidence } = event;
    const fileContent = files.find(
      ({ file }) => file === evidence.jsx.fileName
    )?.content;
    return {
      file: evidence.jsx.fileName.replace(/=/g, '/'),
      ranges: getStartAndEndLineForJSX(evidence.jsx.lineNumber, fileContent),
      fileContent,
      keyPressed: evidence.keyPressed,
      inputType: evidence.InputType,
      type: evidence.type,
    };
  });
  // group the events by file and line
  const groupedEvents = cleanedEvent.reduce((acc, e) => {
    const found = acc.find(
      (a) => a.file === e.file && a.ranges[0] === e.ranges[0]
    );
    if (!found) {
      acc.push({
        ...e,
        count: 1,
      });
    } else {
      found.count += 1;

      found.keyPressed += ` ${e.keyPressed}`;
    }
    return acc;
  }, []);
  return groupedEvents;
};

const cleanCodeCoverageEvidence = (codeCoverages, files) => {
  const cleanedCodeCoverage = codeCoverages.map((codeCoverage) => {
    const { evidence } = codeCoverage;
    const callee = files.find(
      ({ file }) => file.replace(/=/g, '/') === evidence.file
    )?.content;
    const caller = files.find(
      ({ file }) => file.replace(/=/g, '/') === evidence.caller.file
    )?.content;
    return {
      callee: {
        file: evidence.file,
        ranges: evidence.ranges,
      },
      caller: {
        file: evidence.caller.file,
        ranges: evidence.caller.lines,
      },
      calleeContent: callee,
      callerContent: caller,
      type: evidence.type,
      count: evidence.count,
      functionName: evidence.functionName,
    };
  });
  return cleanedCodeCoverage;
};

const cleanningUpEvidence = (hypotheses, files) => {
  return hypotheses.map((hypothesis) => {
    return {
      ...hypothesis,
      evidence: hypothesis.evidence.map((evidence) => {
        const { matched } = evidence;
        if (matched.length === 0) {
          return {
            ...evidence,
            type: 'no evidence',
          };
        }
        const oneMatch = matched[0];

        if (oneMatch.evidence.keyPressed || oneMatch.evidence.type === 'click')
          return {
            ...evidence,
            matched: cleanEventKeyPressAndClickEvidence(matched, files),
            type: oneMatch.evidence.type,
          };

        if (oneMatch.evidence.type === 'codeCoverage')
          return {
            ...evidence,
            matched: cleanCodeCoverageEvidence(matched, files),
            type: oneMatch.evidence.type,
          };
        if (oneMatch.evidence.type === 'responseReceived')
          return {
            ...evidence,
            matched: matched.map((m) => m.evidence),
            type: oneMatch.evidence.type,
          };

        if (oneMatch.evidence.type === 'mutation')
          return {
            ...evidence,
            matched: matched.map((m) => {
              const { removeNode, addNode, timeStamp } = m.evidence;
              return {
                removeNode,
                addNode,
                timeStamp,
              };
            }),
            type: oneMatch.evidence.type,
          };

        return evidence;
      }),
    };
  });
};

// parentPort.postMessage(potintialHypotheses);

const hypotheses = reasonAboutEvidence(
  workerData.gatheredEvidence,
  workerData.knowledgeMap,
  workerData.files
);

const cleanedEvidence = cleanningUpEvidence(hypotheses, workerData.files);

parentPort.postMessage(cleanedEvidence);

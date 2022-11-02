const { parentPort, workerData } = require('worker_threads');

const reasonAboutEvidence = (gatheredEvidence, knowledgeMap) => {
  // knowledgeMap is an array of knowledge that pulled from multiple sources
  return knowledgeMap.flatMap((knowledgeItem) => {
    // knowledgeItem is a single knowledge source with multiple hypotheses
    return knowledgeItem.hypotheses.map((hypothesis) => {
      // For each hypothesis, we need collect the evidence that support it
      // a hypothesis contains a list of evidence in occurence order
      // for each evidence in the hypothesis, we need to check if it is in the gatheredEvidence
      // first, we have a pointer that points at the gatheredEvidence that has not been matched with any evidence in the hypothesis
      // this pointer moves forward when we find a match
      let evidencePointer = 0;
      const gatheredEvidenceRelatedToCurrentHypothesis =
        gatheredEvidence.filter((evidence) => {
          // if the evidence is not in the hypothesis, we don't need to check it
          if (
            hypothesis.evidence.findIndex(
              (evidenceInHypothesis) =>
                evidenceInHypothesis.rule === evidence.rule
            ) === -1
          ) {
            return false;
          }
          return true;
        });

      const evidence = hypothesis.evidence.map((evidence, evidenceIndex) => {
        // for each evidence in the hypothesis, it contains a list of gatheredEvidence that support it
        evidence.matched = [];
        // we removed all gatheredEvidence that is before the evidencePointer
        const currentGatheredEvidence =
          gatheredEvidenceRelatedToCurrentHypothesis.slice(evidencePointer);
        // we loop through the currentGatheredEvidence to find a match
        // add the match to the evidence.gatheredEvidence and move the evidencePointer forward

        // Todo: test if the evidencePointer is out of bound
        currentGatheredEvidence.every((gatheredEvidenceItem) => {
          if (gatheredEvidenceItem.rule === evidence.rule) {
            evidencePointer += 1;
            evidence.matched.push(gatheredEvidenceItem);
            return true;
          }
          // does this gatheredEvidenceItem match a previous evidence in the hypothesis?
          // if it does, we need to move the evidencePointer forward without adding it to the evidence.matched
          const isFoundBefore = hypothesis.evidence
            .slice(0, evidenceIndex)
            .find((evi) => evi.rule === gatheredEvidenceItem.rule);
          if (isFoundBefore) {
            return true;
          }
          return false;
        });
        return evidence;
      });
      return {
        ...hypothesis,
        evidence,
      };
    });
  });
};
const cleanEventKeyPressAndClickEvidence = (events, files) => {
  const cleanedEvent = events.map((event) => {
    const { evidence } = event;
    const fileContent = files.find(
      ({ file }) => file === evidence.jsx.fileName
    )?.content;
    return {
      file: evidence.jsx.fileName.replace(/=/g, '/'),
      line: evidence.jsx.lineNumber,
      fileContent,
      keyPressed: evidence.keyPressed,
      inputType: evidence.InputType,
      type: evidence.type,
    };
  });
  // group the events by file and line
  const groupedEvents = cleanedEvent.reduce((acc, e) => {
    const found = acc.find((a) => a.file === e.file && a.line === e.line);
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

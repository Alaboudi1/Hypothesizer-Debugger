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
    const { evidence, hypotheses } = knowledgeItem;
    const allRules = [];
    Object.entries(evidence).forEach(([key, values]) => {
      allRules.push(
        ...values.flatMap((value) => ({ ...value, evidenceType: key }))
      );
    });

    // knowledgeItem is a single knowledge source with multiple hypotheses
    return hypotheses.map((hypothesis) => {
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
          matched: ev.matched.filter((m) => {
            if (m.evidence.timeStamp === -1) {
              return true;
            }
            return before.some(
              (b) => m.evidence.timeStamp >= b.evidence.timeStamp
            );
            //   &&
            //   after.some((a) => m.evidence.timeStamp <= a.evidence.timeStamp)
            // );
          }),
          rule: allRules.find((r) => r.id === ev.rule),
        };
      });
      // remove matches that occurs in mutiple evidence
      // evidence = evidence.map((ev, index) => {
      //   const evidenceToCheck = evidence.slice(0, index);
      //   return {
      //     ...ev,
      //     matched: ev.matched.filter((m) => {
      //       return !evidenceToCheck.some((e) =>
      //         e.matched.some((m2) => m2.evidence.ID === m.evidence.ID)
      //       );
      //     }),
      //
      //   };
      // });

      return {
        ...hypothesis,
        evidence,
      };
    });
  });
};

const getStartAndEndLineForJSX = (start, fileContent) => {
  const lines = fileContent?.split('\n');
  if (!lines) {
    return [];
  }
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

const cleanNetworkEvidence = (evidence, matched, files) => {
  return {
    ...evidence,
    matched: matched.map((m) => {
      const location = m.evidence.stack?.find((s) => s.file.includes('src'));
      if (!location) return m;
      const file = files.find(
        (f) =>
          f.file.replace(/=/g, '/').split('src')[1] ===
          location.file.split('src')[1]
      );
      return {
        ...m.evidence,
        functionName: location.functionName,
        file: `src${file?.file.replace(/=/g, '/').split('src')[1]}`,
        ranges: [location.lineNumber + 1, location.lineNumber + 1],
        fileContent: file?.content,
      };
    }),
    type: matched[0]?.evidence.type,
  };
};
const cleanDOMEvidence = (events, files) => {
  const cleanedEvent = events.map((event) => {
    const { evidence } = event;
    const fileContent = files.find(
      ({ file }) => file === evidence.jsx.fileName
    )?.content;
    return {
      file: evidence.jsx.fileName?.replace(/=/g, '/'),
      ranges: getStartAndEndLineForJSX(evidence.jsx.lineNumber, fileContent),
      fileContent,
      keyPressed: evidence.keyPressed,
      inputType: evidence.InputType,
      type: evidence.type,
      removeNode: evidence.removeNode,
      addNode: evidence.addNode,
      timeStamp: evidence.timeStamp,
      attributeName: evidence.attributeName,
    };
  });
  return cleanedEvent;
};
const cleanEventKeyPressAndClickEvidence = (events, files) => {
  const cleanedEvent = cleanDOMEvidence(events, files).sort(
    (a, b) => a.timeStamp - b.timeStamp
  );
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

const cleanMutationEvidence = (evidence, files) => {
  const cleanedEvent = cleanDOMEvidence(evidence, files);
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
      found.addNode.push(...e.addNode);
      found.removeNode.push(...e.removeNode);
      found.count += 1;
      found.attributeName += ` ${e.attributeName}`;
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
      ({ file }) => file.replace(/=/g, '/') === evidence.caller?.file
    )?.content;
    return {
      callee: {
        file: evidence.file,
        ranges: evidence.ranges,
      },
      caller: {
        file: evidence.caller?.file,
        ranges: evidence.caller?.lines,
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
    const requestsCache = [];
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

        if (
          oneMatch.evidence.type === 'childList' ||
          oneMatch.evidence.type === 'attributes'
        )
          return {
            ...evidence,
            matched: cleanMutationEvidence(matched, files),
            type: oneMatch.evidence.type,
          };
        if (oneMatch.evidence.type === 'requestWillBeSent') {
          const request = cleanNetworkEvidence(evidence, matched, files);
          requestsCache.push(...request.matched);
          return request;
        }
        if (oneMatch.evidence.type === 'responseReceived')
          return {
            ...evidence,
            matched: matched.map((m) => {
              const request = requestsCache.find(
                (r) => r.requestId === m.evidence.requestId
              );
              return {
                ...m.evidence,
                ranges: request?.ranges,
                functionName: request?.functionName,
                file: request?.file,
                fileContent: request?.fileContent,
              };
            }),
            type: oneMatch.evidence.type,
          };
        return evidence;
      }),
    };
  });
};

const getPotentialHypotheses = (hypotheses) => {
  return (
    hypotheses
      // this is to filter out the hypotheses that have no evidence related to the defect
      .filter((hypothesis) => {
        const criticalEvidence = hypothesis.evidence.filter(
          (e) => e.DoesContainTheDefect
        );
        return criticalEvidence.every((e) => {
          if (e.isFound) return e.matched.length > 0;
          return e.matched.length === 0;
        });
      })
      // this is to filter out the hypotheses that do not have at least one extra evidence related to the defect beside the critical evidence
      .filter((hypothesis) => {
        return hypothesis.evidence.some(
          (e) => e.matched.length > 0 && e.DoesContainTheDefect === false
        );
      })
  );
};

const hypotheses = reasonAboutEvidence(
  workerData.gatheredEvidence,
  workerData.knowledgeMap,
  workerData.files
);

const cleanedHypotheses = cleanningUpEvidence(hypotheses, workerData.files);

const potintialHypotheses = getPotentialHypotheses(cleanedHypotheses);

parentPort.postMessage(potintialHypotheses);

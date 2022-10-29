const { parentPort, workerData } = require('worker_threads');

const reasonAboutEvidence = (gatheredEvidence, knowledgeMap) => {
  // knowledgeMap is an array of knowledge that pulled from multiple sources
  return knowledgeMap.map((knowledgeItem) => {
    // knowledgeItem is a single knowledge source with multiple hypotheses
    return knowledgeItem.hypotheses.map((hypothesis) => {
      // For each hypothesis, we need collect the evidence that support it
      // a hypothesis contains a list of evidence in occurence order
      // for each evidence in the hypothesis, we need to check if it is in the gatheredEvidence
      // first, we have a pointer that points at the gatheredEvidence that has not been matched with any evidence in the hypothesis
      // this pointer moves forward when we find a match
      let evidencePointer = 0;
      return hypothesis.evidence.map((evidence) => {
        // for each evidence in the hypothesis, it contains a list of gatheredEvidence that support it
        evidence.matched = [];
        // we removed all gatheredEvidence that is before the evidencePointer
        const currentGatheredEvidence = gatheredEvidence.slice(evidencePointer);
        // we loop through the currentGatheredEvidence to find a match
        // add the match to the evidence.gatheredEvidence and move the evidencePointer forward

        // TODO: the matching should work for theses cases:
        // 1. the match is not the first gatheredEvidence
        // 2. the next match is not presented in the currentGatheredEvidence
        // 3. the match is the last evidence in the hypothesis
        currentGatheredEvidence.every((gatheredEvidenceItem) => {
          if (gatheredEvidenceItem.rule === evidence.rule) {
            evidencePointer += 1;
            evidence.matched.push(gatheredEvidenceItem);
            return true;
          }
          return false;
        });
        return evidence;
      });
    });
  });
};

const cleanningUpHypotheses = (hypotheses, files) => {};

// parentPort.postMessage(potintialHypotheses);

const hypotheses = reasonAboutEvidence(
  workerData.gatheredEvidence,
  workerData.knowledgeMap,
  workerData.files
);

const cleanedEvidence = cleanningUpHypotheses(hypotheses, workerData.files);

parentPort.postMessage(cleanedEvidence);

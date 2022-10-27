const { parentPort, workerData } = require('worker_threads');

const reasonAboutEvidaence = (gatheredEvidence, knowledgeMap) => {
  return knowledgeMap.map((knowledgeItem) => {
    const { evidance, hypotheses } = JSON.parse(knowledgeItem);
    const allRules = [];
    for (const key in evidance) {
      allRules.push(...evidance[key]);
    }
    const potintialHypotheses = hypotheses.map((hypothesis) => {
      const { hasToPass, hasToFail } = hypothesis.evidence;
      const supportedEvidaence = [];
      const againstEvidaence = [];

      hasToPass.forEach(({ rule, why }) => {
        const evidenceItem = gatheredEvidence.find(
          (item) => item.rule.id === rule
        );
        if (evidenceItem) {
          supportedEvidaence.push({ evidenceItem, shouldBeFound: true, why });
        } else {
          againstEvidaence.push({
            evidenceItem: {
              rule: allRules.find((item) => item.id === rule),
              instances: undefined,
            },
            shouldBeFound: true,
            why,
          });
        }
      });
      hasToFail.forEach(({ rule, why }) => {
        const evidenceItem = gatheredEvidence.find(
          (item) => item.rule.id === rule
        );
        if (evidenceItem) {
          againstEvidaence.push({ evidenceItem, shouldBeFound: false, why });
        } else {
          supportedEvidaence.push({
            evidenceItem: {
              rule: allRules.find((item) => item.id === rule),
              instances: undefined,
            },
            shouldBeFound: false,
            why,
          });
        }
      });
      return {
        supportedEvidaence,
        againstEvidaence,
        ...hypothesis,
        score:
          supportedEvidaence.length /
          (supportedEvidaence.length + againstEvidaence.length),
      };
    });
    parentPort.postMessage(potintialHypotheses);
  });
};
reasonAboutEvidaence(workerData.gatheredEvidence, workerData.knowledgeMap);

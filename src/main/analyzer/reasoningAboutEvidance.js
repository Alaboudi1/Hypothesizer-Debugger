const { parentPort, workerData } = require('worker_threads');

const reasonAboutEvidaence = (gatheredEvidence, knowledgeMap) => {
  return knowledgeMap.map((knowledgeItem) => {
    const { checks, hypotheses } = JSON.parse(knowledgeItem);
    const allRules = [];
    for (const key in checks) {
      allRules.push(...checks[key]);
    }
    const potintialHypotheses = hypotheses.map((evidence) => {
      const { pass, fail } = evidence.checks;
      const supportedEvidaence = [];
      const againstEvidaence = [];

      pass.forEach((rule) => {
        const evidenceItem = gatheredEvidence.find(
          (item) => item.rule.id === rule
        );
        if (evidenceItem) {
          supportedEvidaence.push({ evidenceItem, shouldBeFound: true });
        } else {
          againstEvidaence.push({
            evidenceItem: {
              rule: allRules.find((item) => item.id === rule),
              instances: undefined,
            },
            shouldBeFound: true,
          });
        }
      });
      fail.forEach((rule) => {
        const evidenceItem = gatheredEvidence.find(
          (item) => item.rule.id === rule
        );
        if (evidenceItem) {
          againstEvidaence.push({ evidenceItem, shouldBeFound: false });
        } else {
          supportedEvidaence.push({
            evidenceItem: {
              rule: allRules.find((item) => item.id === rule),
              instances: undefined,
            },
            shouldBeFound: false,
          });
        }
      });
      return {
        supportedEvidaence,
        againstEvidaence,
        ...evidence,
        score:
          supportedEvidaence.length /
          (supportedEvidaence.length + againstEvidaence.length),
      };
    });
    parentPort.postMessage(potintialHypotheses);
  });
};
reasonAboutEvidaence(workerData.gatheredEvidence, workerData.knowledgeMap);

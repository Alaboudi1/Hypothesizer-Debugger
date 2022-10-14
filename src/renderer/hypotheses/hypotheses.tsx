import React from 'react';
import './hypotheses.css';
import CodeSnipet from '../codeSnippet/codeSnippet';

const Hypotheses: React.FC<any> = ({
  hypotheses,
  userAnswers,
}): JSX.Element => {
  const getEventEvidence = (evidence: any) => {
    const { instances } = evidence.evidenceItem;
    const snipts = instances.reduce((acc: any, instance: any) => {
      const { content, file } = instance.evidance.jsx?.fileContent;
      const { lineNumber } = instance.evidance.jsx;
      if (
        acc.find((snipt: any) => snipt.file === file) &&
        acc.find((snipt: any) => snipt.lineNumber === lineNumber)
      )
        return acc;
      acc.push({ code: content, lineNumber, fileName: file });
      return acc;
    }, []);
    return (
      <>
        <summary className="eventItem">
          {evidence.shouldBeFound
            ? `We found ${instances.length} instances of`
            : 'We did not find any instance of'}{' '}
          {instances[0].evidance.InputType} {instances[0].evidance.type} event.
        </summary>

        {snipts.map((snipt: any) => (
          <CodeSnipet
            code={snipt.code}
            lineNumber={snipt.lineNumber}
            fileName={snipt.fileName}
          />
        ))}
      </>
    );
  };

  const getApiEvidence = (evidence: any) => {
    return <summary className="eventItem"></summary>;
  };

  const getNetworkEvidence = (evidence: any) => {
    return <summary className="eventItem"></summary>;
  };

  const getEvidenceList = (evidence) => {
    switch (evidence.evidenceItem.rule.id.split('_')[0]) {
      // if it start with EVENT
      case 'EVENT':
        return getEventEvidence(evidence);
      case 'API':
        return getApiEvidence(evidence);
      case 'NETWORK':
        return getNetworkEvidence(evidence);
      default:
        <> Found an evidnace but could not regonize its type</>;
    }
  };

  return (
    <div className="container">
      <div className="defectDescription">
        <h3>🐛 Bug Description</h3>
        <ol>
          {userAnswers.map((answer, index) => (
            <li key={index}>
              <span>{answer.answer}</span>
            </li>
          ))}
        </ol>
        {hypotheses.length > 0 ? (
          <p className="hypothesesFound">
            🎉 We found {hypotheses.length} potential hypothese(s) that may
            explain what causes the bug!
          </p>
        ) : (
          <p className="hypothesesNoFound">
            We couldn't find any potential hypotheses that might explain what
            causes the bug!
          </p>
        )}
      </div>
      <div className="hypotheses">
        <h3>💡 Hypotheses</h3>
        {hypotheses.map((hypothesis, index) => (
          <details key={index}>
            <summary>
              <b>
                <i>H{index + 1}:</i>
              </b>
              <span> {hypothesis.hypothesis} </span>
              <span className="status">
                <span>Tell me more!</span>
              </span>
            </summary>
            <div className="description">
              <b>Description: </b>
              {hypothesis.description}{' '}
            </div>
            <details className="evidanceList">
              <summary>
                <b>Why do we think this hypothesis is correct?</b>
              </summary>
              {hypothesis.supportedEvidaence.map((evidence, index) => (
                <details key={index}>{getEvidenceList(evidence)}</details>
              ))}
            </details>
            <details className="fix">
              <summary>
                <b>How can I fix this bug?</b>
              </summary>
            </details>
          </details>
        ))}
      </div>
    </div>
  );
};

export default Hypotheses;

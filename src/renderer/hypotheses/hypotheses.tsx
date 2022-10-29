import React from 'react';
import './hypotheses.css';
import CodeSnipet from '../codeSnippet/codeSnippet';

const Hypotheses: React.FC<any> = ({ hypotheses }): JSX.Element => {
  const getEventEvidence = (evidence: any) => {
    const { instances } = evidence.evidenceItem;
    const snippet = instances.reduce((acc: any, instance: any) => {
      const { content, file } = instance.jsx?.fileContent;
      const { lineNumber } = instance.jsx;
      if (
        acc.find((snipt: any) => snipt.fileName === file) &&
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
            ? `You ${instances[0].type}ed (${
                instances.length
              }) time(s) on an ${instances[0].target.toLowerCase()} element, which triggerd ${
                instances[0].InputType
              }  event(s).`
            : `You did not trigger any ${evidence.evidenceItem.rule.InputType}`}{' '}
        </summary>
        <div className="description">
          <b>Description: </b>
          {evidence.why}
        </div>
        {snippet.map((snipt: any) => (
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
    const { instances } = evidence.evidenceItem;
    const snippet = instances?.reduce((acc: any, instance: any) => {
      const { content, file } = instance.jsx?.fileContent;
      const { lineNumber } = instance.jsx;
      if (
        acc.find((snipt: any) => snipt.fileName === file) &&
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
            ? `You ${instances[0].type}ed (${
                instances.length
              }) time(s) on an ${instances[0].target.toLowerCase()} element, which triggerd ${
                instances[0].InputType
              }  event(s).`
            : `You did not use ${evidence.evidenceItem.rule.functionName} API`}{' '}
        </summary>
        <div className="description">
          <b>Description: </b>
          {evidence.why}
        </div>
        {snippet?.map((snipt: any) => (
          <CodeSnipet
            code={snipt.code}
            lineNumber={snipt.lineNumber}
            fileName={snipt.fileName}
          />
        ))}
      </>
    );

    return <summary className="eventItem" />;
  };

  const getNetworkEvidence = (evidence: any) => {
    const { instances } = evidence.evidenceItem;
    const snippet = instances.reduce((acc: any, instance: any) => {
      const { functionName, file, lineNumber } =
        // potintial bug here? not sure if this is the correct way to access the file content
        instance.assoisatedRequestsForResponses?.stack || {};
      if (
        file === undefined ||
        (acc.find((snipt: any) => snipt.file === file) &&
          acc.find((snipt: any) => snipt.lineNumber === lineNumber))
      )
        return acc;
      acc.push({ code: functionName, lineNumber, fileName: file });
      return acc;
    }, []);
    return (
      <>
        <summary className="eventItem">
          {evidence.shouldBeFound
            ? `You made (${instances.length}) ${instances[0].assoisatedRequestsForResponses.method} network request(s) to ${instances[0].assoisatedRequestsForResponses?.url}.`
            : `You did not make any network request`}
        </summary>

        <div className="description">
          <b>Description: </b>
          {evidence.why}
        </div>
        {snippet.map((snipt: any) => (
          <CodeSnipet
            code={snipt.code}
            lineNumber={snipt.lineNumber}
            fileName={snipt.fileName}
          />
        ))}
      </>
    );
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
        {hypotheses.length > 0 ? (
          <p className="hypothesesFound">
            🎉 We found {hypotheses.length} potential hypothese(s) that may
            explain what causes the bug!
          </p>
        ) : (
          <p className="hypothesesNoFound">
            🫤 We couldn't find any potential hypotheses that might explain what
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
              <span className="tellMeMore">Tell me more!</span>
            </summary>
            <div className="description">
              <b>Description: </b>
              {hypothesis.description}{' '}
            </div>
            <details className="evidenceList">
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
              <div className="description">
                <b>Description: </b>
                {hypothesis.howToFix.description}{' '}
              </div>

              <ul className="Links">
                {hypothesis.howToFix.links.map((link, index) => (
                  <li key={index}>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </details>
        ))}
      </div>
    </div>
  );
};

export default Hypotheses;

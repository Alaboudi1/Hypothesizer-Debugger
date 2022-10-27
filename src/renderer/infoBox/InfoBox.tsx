import React from 'react';
import './InfoBox.css';
import CodeSnipet from '../codeSnippet/codeSnippet';

const InfoBox: React.FC<any> = ({ hypotheses }): JSX.Element => {
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

  return (
    <div className="timeLine__item__box__content">
      <h3>Item 1</h3>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quae.
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
        quae.
      </p>
    </div>
  );
};

export default InfoBox;

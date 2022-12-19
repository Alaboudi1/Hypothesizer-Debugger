import React from 'react';
import htmlBeautify from 'html-beautify';
import './InfoBox.css';
import CodeSnipet from '../codeSnippet/CodeSnippet';
import ReactJson from 'react-json-view';

const getTypeingEventContent = (matches) => {
  return matches.map((match) => {
    return (
      <p key={match + Math.random()}>
        <p>
          You typed: <i>{match.keyPressed} </i> in the following file:
        </p>
        {match.fileContent && (
          <CodeSnipet
            code={match.fileContent}
            lineNumbers={match.ranges}
            fileName={match.file}
          />
        )}
        {match.fileContent === undefined && (
          <>
            <p>
              {' '}
              <b> File:</b> {match.file}{' '}
            </p>
            <p>
              {' '}
              <b> Line:</b> {match.ranges[0]}{' '}
            </p>
          </>
        )}
      </p>
    );
  });
};
const getClickEventContent = (matches) => {
  return matches.map((match) => {
    return (
      <p key={match + Math.random()}>
        <p>You clicked on the element in the following file: </p>
        {match.fileContent && (
          <CodeSnipet
            code={match.fileContent}
            lineNumbers={match.ranges}
            fileName={match.file}
          />
        )}
        {match.fileContent === undefined && (
          <>
            <p>
              {' '}
              <b> File:</b> {match.file}{' '}
            </p>
            <p>
              {' '}
              <b> Line:</b> {match.ranges[0]}{' '}
            </p>
          </>
        )}
      </p>
    );
  });
};

const getMutationEventContent = (matches) => {
  return matches.flatMap((match) => {
    const info = [];
    if (match.removeNode.length > 0) {
      info.push(
        <>
          <p> this html nodes were removed</p>
          <CodeSnipet
            code={htmlBeautify(
              match.removeNode.map((node) => node.HTML).join(' ')
            )}
            lineNumbers={[]}
            fileName="html"
          />
        </>
      );
    }

    if (match.addNode.length > 0)
      info.push(
        <>
          <p> this html nodes were added</p>
          <CodeSnipet
            code={htmlBeautify(
              match.addNode.map((node) => node.HTML).join(' ')
            )}
            lineNumbers={[]}
            fileName="html"
          />
        </>
      );
    if (match.type === 'attributes')
      info.push(
        <>
          <p>
            {' '}
            the attribute {match.attributeName} was changed to{' '}
            {match.attributeValue}
          </p>
          <CodeSnipet
            code={match.fileContent}
            lineNumbers={match.ranges}
            fileName={match.file}
          />
        </>
      );
    return info;
  });
};

const HowToFix = (evidence, hypotheses) => {
  if (evidence.DoesContainTheDefect)
    return (
      <>
        <p>
          <b>How To Fix?</b>
          <ol>
            {evidence.HowToFix.steps.map((step) => {
              const { description, codeExample, relatedEvidenceLocation } =
                step;
              return (
                <>
                  <li key={step + Math.random()}>{description}</li>
                  {codeExample && (
                    <CodeSnipet
                      code={codeExample}
                      lineNumbers={[]}
                      fileName="tsx"
                    />
                  )}

                  {relatedEvidenceLocation &&
                    hypotheses.evidence
                      .filter((e) => relatedEvidenceLocation.rule === e.rule.id)
                      .map((e) => {
                        const location = e.matched.find(
                          (m) => m.file !== undefined
                        );
                        if (location) {
                          const { fileContent, file, ranges } = location;
                          return (
                            <CodeSnipet
                              code={fileContent}
                              lineNumbers={
                                relatedEvidenceLocation.exactLocation
                                  ? ranges
                                  : [0, 0]
                              }
                              fileName={file}
                            />
                          );
                        }
                        return <b>No file found!</b>;
                      })}
                </>
              );
            })}
          </ol>
          {evidence.HowToFix.links && (
            <p>
              <b>Please read these links if need further information:</b>
              <ul>
                {evidence.HowToFix.links.map(({ url, title }) => {
                  return (
                    <li key={url + Math.random()}>
                      <a href={url}>{title}</a>
                    </li>
                  );
                })}
              </ul>
            </p>
          )}
        </p>
      </>
    );
};

const getCodeCoverage = (codeCoverage) => {
  return codeCoverage.evidence.map((match) => {
    switch (codeCoverage.type) {
      case 'API_call_with_pattern':
        return (
          <>
            <p>
              You called this function: <i>{match.functionName}</i> in the
              following file:
            </p>

            <CodeSnipet
              code={match.fileContent}
              lineNumbers={match.lines}
              fileName={match.file}
            />
          </>
        );

      case 'API_call':
        return (
          <>
            <p>
              You called this function: <i>{match.functionName}</i>
            </p>
          </>
        );
      case 'API_pattern':
        return (
          <>
            <CodeSnipet
              code={match.fileContent}
              lineNumbers={match.lines}
              fileName={match.file}
            />
          </>
        );
      default:
        return <></>;
    }
  });
};

const getNoEvidenceContent = (evidence) => {
  return <>No evidence found on the execution trace.</>;
};

const getReqeustWillBeSentContent = (matches) => {
  return matches.map((match) => {
    return (
      <>
        {match.file ? (
          <>
            The request has this properties:
            <ReactJson
              src={{
                method: match.method,
                url: match.url,
                id: match.requestId,
              }}
              collapseStringsAfterLength={100}
              theme="monokai"
              name={false}
              collapsed={1}
            />
            <p>
              The request was sent inside <i>{match.functionName}</i> in the
              following file:
            </p>
            <CodeSnipet
              code={match.fileContent}
              lineNumbers={match.ranges}
              fileName={match.file}
            />
          </>
        ) : (
          <></>
        )}
      </>
    );
  });
};

const getResponseReceivedContent = (matches) => {
  return matches.map((match) => {
    return (
      <>
        {match.file ? (
          <>
            The response has this properties:
            <ReactJson
              src={{
                status: match.status,
                id: match.requestId,
                url: match.url,
                mimeType: match.mimeType,
                paylod: JSON.parse(match.data),
              }}
              collapseStringsAfterLength={100}
              theme="monokai"
              name={false}
              collapsed={1}
            />
            <p>
              The response was received inside <i>{match.functionName}</i> in
              the following file:
            </p>
            <CodeSnipet
              code={match.fileContent}
              lineNumbers={match.ranges}
              fileName={match.file}
            />
          </>
        ) : (
          <></>
        )}
      </>
    );
  });
};

const InfoBox: React.FC<any> = ({ evidence, hypotheses }): JSX.Element => {
  const getInformation = (evidence) => {
    switch (evidence.type) {
      case 'keydown':
        return getTypeingEventContent(evidence.matched);
      case 'click':
        return getClickEventContent(evidence.matched);
      case 'childList':
      case 'attributes':
        return getMutationEventContent(evidence.matched);
      case 'codeCoverage':
        return getCodeCoverage(evidence.matched);
      case 'requestWillBeSent':
        return getReqeustWillBeSentContent(evidence.matched);
      case 'responseReceived':
        return getResponseReceivedContent(evidence.matched);
      default:
        return getNoEvidenceContent(evidence);
    }
  };
  return (
    <div className="timeLine__item__box__content">
      <h3>{evidence.type}</h3>
      <p>{evidence.description}</p>
      {getInformation(evidence)}
      {HowToFix(evidence, hypotheses)}
    </div>
  );
};

export default InfoBox;

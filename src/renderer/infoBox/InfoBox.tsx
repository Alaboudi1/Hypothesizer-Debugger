import React from 'react';
import htmlBeautify from 'html-beautify';
import './InfoBox.css';
import ReactJson from 'react-json-view';
import CodeSnipet from '../codeSnippet/CodeSnippet';

const getTypeingEventContent = (matches, linkToProject) => {
  return matches.map((match) => {
    return (
      <p key={match + Math.random()}>
        <p>
          You typed: <i>{match.keyPressed} </i> in the following file:
        </p>
        {match.fileContent && (
          <CodeSnipet
            linkToProject={linkToProject}
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
const getClickEventContent = (matches, linkToProject) => {
  return (
    <>
      <p>
        You {matches[0].type} on {matches.length} elements
      </p>
      {matches.map((match) => (
        <p key={match + Math.random()}>
          {match.fileContent && (
            <CodeSnipet
              linkToProject={linkToProject}
              code={match.fileContent}
              lineNumbers={match.ranges}
              fileName={match.file}
            />
          )}
          {match.fileContent === undefined && match.file !== 'srcundefined' && (
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
      ))}
    </>
  );
};

const getMutationEventContent = (matches, linkToProject) => {
  return matches.flatMap((match) => {
    const info = [];
    if (match.removeNode.length > 0) {
      info.push(
        <>
          <p> this html nodes were removed</p>
          <CodeSnipet
            linkToProject={linkToProject}
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
            linkToProject={linkToProject}
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
            linkToProject={linkToProject}
            code={match.fileContent}
            lineNumbers={match.ranges}
            fileName={match.file}
          />
        </>
      );
    return info;
  });
};

const HowToFix = (evidence, hypotheses, linkToProject) => {
  if (evidence.DoesContainTheDefect)
    return (
      <>
        <p>
          <b>How To Fix? <small style={{ color: 'red' }}
          > <i>Please follow these {evidence.HowToFix.steps.length} steps: </i> </small></b>

          <ol>
            {evidence.HowToFix.steps.map((step) => {
              const { description, codeExample, relatedEvidenceLocation } =
                step;
              return (
                <>
                  <li key={step + Math.random()}>{description}</li>
                  {codeExample && (
                    <CodeSnipet
                      linkToProject={linkToProject}
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
                              linkToProject={linkToProject}
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
                        const locations = e.matched.filter(
                          (m) => m.evidence.length > 0
                        );
                        if (locations.length > 0) {
                          return locations.map((location) =>
                            location.evidence.map((ev) => {
                              const { fileContent, file, lines } = ev;
                              return (
                                <CodeSnipet
                                  linkToProject={linkToProject}
                                  code={fileContent}
                                  lineNumbers={
                                    relatedEvidenceLocation.exactLocation
                                      ? lines
                                      : [0, 0]
                                  }
                                  fileName={file}
                                />
                              );
                            })
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
                      <a href={url} target="_blank" rel="noreferrer">
                        {title}
                      </a>
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

const getCodeCoverage = (codeCoverage, linkToProject) => {
  const item = codeCoverage[0];
  return (
    <>
      <p>This API has been called in {item.evidence.length} files</p>
      {item.evidence.map((match) => {
        switch (item.type) {
          case 'API_call_with_pattern':
            return (
              <>
                {/* <p> {match.functionName}</p> */}
                <CodeSnipet
                  linkToProject={linkToProject}
                  code={match.fileContent}
                  lineNumbers={match.lines}
                  fileName={match.file}
                />
              </>
            );

          case 'API_call':
            return (
              <>
                <p>{match.functionName}</p>
              </>
            );
          case 'API_pattern':
            return (
              <>
                <CodeSnipet
                  linkToProject={linkToProject}
                  code={match.fileContent}
                  lineNumbers={match.lines}
                  fileName={match.file}
                />
              </>
            );
          default:
            return <></>;
        }
      })}
    </>
  );
};

const getReqeustWillBeSentContent = (matches, linkToProject) => {
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
              linkToProject={linkToProject}
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

const getResponseReceivedContent = (matches, linkToProject) => {
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
              linkToProject={linkToProject}
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

const InfoBox: React.FC<any> = ({
  evidence,
  hypotheses,
  linkToProject,
}): JSX.Element => {
  const getInformation = (evidence, linkToProject) => {
    switch (evidence.type) {
      case 'keydown':
        return getTypeingEventContent(evidence.matched, linkToProject);
      case 'click':
      case 'mouseover':
      case 'mouseout':
        return getClickEventContent(evidence.matched, linkToProject);
      case 'childList':
      case 'attributes':
        return getMutationEventContent(evidence.matched, linkToProject);
      case 'codeCoverage':
        return getCodeCoverage(evidence.matched, linkToProject);
      case 'requestWillBeSent':
        return getReqeustWillBeSentContent(evidence.matched, linkToProject);
      case 'responseReceived':
        return getResponseReceivedContent(evidence.matched, linkToProject);
      default:
        return <></>;
    }
  };
  const getTitle = (evidence) => {
    if (evidence.DoesContainTheDefect === true)
      return (
        <h3 className="warning">
          {' '}
          This is where the bug might have happened!{' '}
        </h3>
      );
    if (evidence.isFound === false && evidence.matched.length === 0)
      return (
        <h3 className="found">
          {' '}
          This did not happen in your program, but was expected!
        </h3>
      );
    if (evidence.isFound === false && evidence.matched.length > 0)
      return (
        <h3 className="missing">
          {' '}
          This did happen in your program, but was expected not to happen!
        </h3>
      );
    if (evidence.isFound === true && evidence.matched.length > 0)
      return (
        <h3 className="found">
          {' '}
          This did happen in your program, and was expected!
        </h3>
      );
    if (evidence.isFound === true && evidence.matched.length === 0)
      return (
        <h3 className="missing">
          {' '}
          This did not happen in your program, but was expected to happen!
        </h3>
      );
  };

  return (
    <div className="timeLine__item__box__content">
      {getTitle(evidence)}
      <p>{evidence.description}</p>
      {getInformation(evidence, linkToProject)}
      {HowToFix(evidence, hypotheses, linkToProject)}
    </div>
  );
};

export default InfoBox;

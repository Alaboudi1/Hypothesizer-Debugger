import React from 'react';
import './InfoBox.css';
import CodeSnipet from '../codeSnippet/codeSnippet';

const InfoBox: React.FC<any> = ({ evidence, hypotheses }): JSX.Element => {
  return (
    <div className="timeLine__item__box__content">
      <h3>{evidence.type}</h3>
      <p>{evidence.description}</p>
      {evidence.matched.map((match) => {
        if (evidence.type === 'keydown') {
          return (
            <p key={match + Math.random()}>
              <p>
                You typed: <i>{match.keyPressed}</i>
              </p>
              <p>The typing was handled by the code in the following file: </p>
              <CodeSnipet
                code={match.fileContent}
                lineNumber={match.line}
                fileName={match.file}
              />
            </p>
          );
        }
        if (evidence.type === 'click') {
          return (
            <p key={match + Math.random()}>
              <p>You clicked on the element in the following file: </p>
              <CodeSnipet
                code={match.fileContent}
                lineNumber={match.line}
                fileName={match.file}
              />
            </p>
          );
        }

        if (evidence.type === 'mutation') {
          if (match.removeNode.length > 0) {
            return (
              <>
                <p> this html node was removed</p>
                <CodeSnipet
                  code={match.removeNode.map((node) => node.HTML).join('')}
                  lineNumber={0}
                  fileName={'.html'}
                />
              </>
            );
          }

          if (match.addNode.length > 0)
            return (
              <>
                <p> this html node was added</p>
                <CodeSnipet
                  code={match.addNode.map((node) => node.HTML).join('')}
                  lineNumber={0}
                  fileName={'.html'}
                />
              </>
            );
        }
      })}
      {evidence.DoesContainTheDefect && (
        <>
          <p>
            <b>How To Fix?</b>
            {evidence.CodeExample && (
              <p> Here is an example of how to fix the defect: </p>
            )}
            <CodeSnipet
              code={evidence.CodeExample}
              lineNumber={0}
              fileName={'.js'}
            />
          </p>
          <p> Here are some external Documentation: </p>
          <ul>
            {evidence.links.map((doc) => (
              <li key={doc + Math.random()}>
                <a href={doc.url} target="_blank" rel="noreferrer">
                  {doc.title}
                </a>
              </li>
            ))}
          </ul>
          <p>
            Where to start?
            {hypotheses.evidence
              .filter((e) =>
                evidence.relatedEvidenceFix.find((ev) => ev === e.rule)
              )
              .map((e) => {
                return (
                  <CodeSnipet
                    code={e.matched[0].fileContent}
                    lineNumber={e.matched[0].line}
                    fileName={e.matched[0].file}
                  />
                );
              })}
          </p>
        </>
      )}
    </div>
  );
};
export default InfoBox;

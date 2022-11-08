import React from 'react';
import htmlBeautify from 'html-beautify';
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
                lineNumbers={match.ranges}
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
                lineNumbers={match.ranges}
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
                  code={htmlBeautify(
                    match.removeNode.map((node) => node.HTML).join('')
                  )}
                  lineNumbers={[]}
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
                  code={htmlBeautify(
                    match.addNode.map((node) => node.HTML).join('')
                  )}
                  lineNumbers={[]}
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
                        fileName={'.js'}
                      />
                    )}

                    {relatedEvidenceLocation &&
                      hypotheses.evidence
                        .filter((e) => relatedEvidenceLocation === e.rule)
                        .map((e) => {
                          return (
                            <CodeSnipet
                              code={e.matched[0].fileContent}
                              lineNumbers={[0, 0]}
                              fileName={e.matched[0].file}
                            />
                          );
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
      )}
    </div>
  );
};

export default InfoBox;

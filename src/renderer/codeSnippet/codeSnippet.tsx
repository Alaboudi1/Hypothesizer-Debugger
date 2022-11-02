import React, { useState } from 'react';
import { CopyBlock, dracula } from 'react-code-blocks';
import './codeSnippet.css';

const CodeSnipet: React.FC<any> = ({
  code,
  lineNumber,
  fileName,
}): JSX.Element => {
  // make expandable code snippet
  const [expand, setExpand] = useState(false);
  const cleanCode = code.split('\n');
  const [sourceCode, setSourceCode] = useState(
    cleanCode.slice(lineNumber - 5, lineNumber + 5).join('\n')
  );

  const handleExpand = () => {
    if (expand) {
      const focusedLine = cleanCode
        .slice(lineNumber - 5, lineNumber + 5)
        .join('\n');

      setSourceCode(focusedLine);
    } else {
      setSourceCode(cleanCode.join('\n'));
    }
    setExpand(!expand);
  };

  return (
    <div className="codeSnipet">
      {lineNumber > 0 ? (
        <>
          {fileName && (
            <p>
              <b>Location</b>: src{fileName.split('src').pop()} : {lineNumber}{' '}
            </p>
          )}

          <button type="button" onClick={handleExpand} className="expandButton">
            {expand ? '⤪ Collapse' : '⤢ Expand'}
          </button>
          <div
            className={`codeSnipetBody ${expand ? 'expanded' : ' collapsed'}`}
          >
            <CopyBlock
              text={sourceCode}
              language={`${fileName?.split('.').pop()}`}
              showLineNumbers
              theme={dracula}
              startingLineNumber={expand ? 1 : lineNumber - 4}
            />
          </div>
        </>
      ) : (
        <div className="codeSnipetBody">
          <CopyBlock
            text={sourceCode}
            language={`${fileName?.split('.').pop()}`}
            theme={dracula}
          />
        </div>
      )}
    </div>
  );
};

export default CodeSnipet;

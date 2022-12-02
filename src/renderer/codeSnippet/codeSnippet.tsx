import React, { useEffect } from 'react';
import { CopyBlock, CodeBlock, dracula } from 'react-code-blocks';
import './codeSnippet.css';

const CodeSnippet: React.FC<any> = ({
  code,
  lineNumbers,
  fileName,
}): JSX.Element => {
  const divRef = React.createRef<HTMLDivElement>();
  const linesHighlighted = (codeLines) => {
    codeLines?.forEach((line, index) => {
      if (index + 1 >= lineNumbers[0] && index + 1 <= lineNumbers[1])
        line.classList.add('highlight');
      line.style.opacity = '1';
    });
  };

  useEffect(() => {
    if (lineNumbers.length > 0) {
      const codeSniptDev = divRef.current?.firstChild;
      const copyButton = codeSniptDev?.lastChild;
      if (copyButton) codeSniptDev.removeChild(copyButton);
      const codeLines = codeSniptDev?.firstChild?.lastChild?.childNodes;
      if (codeLines?.length === 1)
        setTimeout(() => linesHighlighted(codeLines), 100);
      else linesHighlighted(codeLines);
      divRef.current?.scrollBy({
        top: lineNumbers[0] * 17 - 50,
        behavior: 'smooth',
      });
    }
  }, [lineNumbers, divRef]);
  return (
    <div key={code + Math.random()}>
      {lineNumbers.length > 0 ? (
        <>
          <p className="fileName"> {fileName}</p>
          <div ref={divRef} className="codeSnippet">
            <CopyBlock
              text={code}
              language={`${fileName?.split('.').pop()}`}
              showLineNumbers
              theme={dracula}
              highlight={`${lineNumbers[0]}-${lineNumbers[1]}`}
            />
          </div>
        </>
      ) : (
        <div className="codeSnippet">
          <CodeBlock
            text={code}
            language={`${fileName?.split('.').pop()}`}
            theme={dracula}
            showLineNumbers={false}
            wrapLines
          />
        </div>
      )}
    </div>
  );
};

export default CodeSnippet;

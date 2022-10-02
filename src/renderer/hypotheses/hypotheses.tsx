import React from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';

import './hypotheses.css';

const Hypotheses: React.FC<any> = ({ hypotheses }): JSX.Element => {
  return (
    <container>
      <h2>There are (1) hypotheses</h2>
      <details>
        <summary>
          <b>
            <i>H1: </i>
          </b>
          <span>
            You are not preventing the default behavior of the submit event,
            which cause the page to reload instead of rendering the new content.
          </span>
          <div className="status">
            <span>Found 3 evidance in support of this hypothesis.</span>
            <span>...</span>
          </div>
        </summary>
        <ul>
          <li>
            <div className="success">
              A relvent event has been triggered
              <span className="info">
                A submit event is an event that get trigger from a form to send
                the data to the server.
              </span>
            </div>
            <div className="code">
              <CodeEditor
                value={`
                    <div>
                      <h1>hello world</h1>
                    </div>
                    `}
                language="jsx"
                contentEditable={false}
              />
            </div>
          </li>
          <li>
            <div className="success">
              A relvent code has been found
              <span className="info">
                info here about the warning status. Lorem ipsum dolor sit amet,
                consectetur adipiscing elit. Cras imperdiet eros eu nisl maximus
                auctor. Aenean tempus ornare urna ultricies lacinia. Duis
                laoreet pharetra lectus eu maximus. Fusce ut ante convallis,
                placerat risus in, molestie diam. Nam vitae mollis massa, nec
                commodo purus
              </span>
            </div>
            <div className="code">
              <CodeEditor
                value={`
                    <div>
                      <h1>hello world</h1>
                    </div>
                    `}
                language="jsx"
                contentEditable={false}
              />
            </div>
          </li>
          <li>
            <div className="success">
              A relvent network request has been sent
              <span className="status">succeeded</span>
            </div>
          </li>
        </ul>
      </details>
    </container>
  );
};

export default Hypotheses;

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
              Relvent <i>Submit</i> event(s) have been triggered
              <span className="info">
                A submit event is an event that get trigger from a form to send
                the data to the server.
              </span>
            </div>
            <div className="code">
              <small>
                Location: <i>src/components/Search.tsx Line: 22</i>{' '}
              </small>
              <CodeEditor
                value={`
                  <form onSubmit={callSearchFunction}>
                      <input
                        className="searchInput"
                        value={searchValue}
                        onChange={handleSearchInputChanges}
                        type="text"
                        placeholder="Search for a movie..."
                      />
                    `}
                language="jsx"
                contentEditable={false}
              />
            </div>
          </li>
          <li>
            <div className="success">
              Relvent network request(s) / response(s) have been made
              <span className="info">
                There were network activites that might have cuased the entire
                page to reload.
              </span>
            </div>
          </li>
          <li>
            <div className="success">
              A relvent API useage (preventDefault) was missing.
              <span className="info">
                You did not use the preventDefault API call on the submit event
                handler to prevent the default behavior of the submit event.
              </span>
            </div>
          </li>
        </ul>
      </details>
    </container>
  );
};

export default Hypotheses;

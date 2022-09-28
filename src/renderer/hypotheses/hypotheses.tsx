import React from 'react';
import './hypotheses.css';

const Hypotheses: React.FC<any> = ({ hypotheses }): JSX.Element => {
  console.log(hypotheses);
  return (
    <container>
      <h2>There are 3 hypotheses</h2>
      <details>
        <summary className="warning">API Unit Tests</summary>
        <ul>
          <li>
            <div className="success">
              Test 1<span className="status">succeeded</span>
            </div>
          </li>
          <li>
            <div className="warning">
              Test 2<span className="status">warning</span>
              <span className="info">
                info here about the warning status. Lorem ipsum dolor sit amet,
                consectetur adipiscing elit. Cras imperdiet eros eu nisl maximus
                auctor. Aenean tempus ornare urna ultricies lacinia. Duis
                laoreet pharetra lectus eu maximus. Fusce ut ante convallis,
                placerat risus in, molestie diam. Nam vitae mollis massa, nec
                commodo purus
              </span>
            </div>
          </li>
          <li>
            <div className="success">
              Test 3<span className="status">succeeded</span>
            </div>
          </li>
        </ul>
      </details>
    </container>
  );
};

export default Hypotheses;

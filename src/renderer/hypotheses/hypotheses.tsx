import React from 'react';
import './hypotheses.css';
import TimeLine from '../timeLine/TimeLine';

const Hypotheses: React.FC<any> = ({ hypotheses }): JSX.Element => {
  return (
    <div className="container">
      <div className="defectDescription">
        {hypotheses.length > 0 ? (
          <p className="hypothesesFound">
            🎉 We found {hypotheses.length} potential hypothese(s) that may
            explain what causes the bug!
          </p>
        ) : (
          <p className="hypothesesNoFound">
            🫤 We couldn't find any potential hypotheses that might explain what
            causes the bug!
          </p>
        )}
      </div>
      <div className="hypotheses">
        <h3>💡 Hypotheses</h3>
        {hypotheses.map((hypothesis, index) => (
          <details key={index}>
            <summary>
              <b>
                <i>H{index + 1}:</i>
              </b>
              <span> {hypothesis.hypothesis} </span>
              <span className="tellMeMore">Tell me more!</span>
            </summary>
            <TimeLine hypothesis={hypothesis} />
          </details>
        ))}
      </div>
    </div>
  );
};

export default Hypotheses;

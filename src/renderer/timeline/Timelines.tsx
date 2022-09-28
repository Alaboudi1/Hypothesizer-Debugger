import React from 'react';
import './Timelines.css';

const Timeline: React.FC<any> = ({ trace, filesContent }): JSX.Element => {
  const getTimeline = (): JSX.Element => {
    return (
      <>
        {trace.map((item, index) => (
          <div className="timeline__item" key={index}>
            <div className="dot">
              <button type="button" className="dot__button">
                <span className="dot__button__text"> #</span>
              </button>
              <div className="dot__line">&nbsp;</div>
            </div>
            <div className="content">
              {item.turn}
              <div className="content__coverage">
                <details>
                  <summary>
                    DOM Eevents: {item.values.UICoverage.length}
                  </summary>
                </details>
                <details>
                  <summary>
                    Code Coverage: {item.values.codeCoverage.length}
                  </summary>
                  <ul>
                    {item.values.codeCoverage.map((coverage, index) => (
                      <li key={index}>
                        {coverage.file.split('/').pop()} :{' '}
                        {coverage.functions.length}
                      </li>
                    ))}
                  </ul>
                </details>

                <details>
                  <summary>
                    Network Activites: {item.values.networkCoverage.length}
                  </summary>
                </details>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };
  return getTimeline();
};
export default Timeline;

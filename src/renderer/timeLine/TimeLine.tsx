import { useRef, useState } from 'react';
import InfoBox from '../infoBox/InfoBox';
import './TimeLine.css';
import click from './icons/click.png';
import typing from './icons/typing.png';
import network from './icons/network.png';
import render from './icons/render.png';
import code from './icons/code.png';
import missing from './icons/missing.png';

function TimeLine({ hypotheses }) {
  const boxRef = useRef(null);
  const [infoBoxData, setInfoBoxData] = useState(hypotheses[0].evidence[0]);
  const [hypotheseUnderInvestigation, setHypotheseUnderInvestigation] =
    useState(0);

  const selectedDot = (e) => {
    // id to number
    const id = parseInt(e.currentTarget.id, 10);
    boxRef.current.style.transform = `translateY(${id * 92 + 2}px)`;
    setInfoBoxData(hypotheses[hypotheseUnderInvestigation].evidence[id]);
  };
  const getIcon = (type) => {
    switch (type) {
      case 'click':
        return click;
      case 'keydown':
        return typing;
      case 'responseReceived':
        return network;
      case 'mutation':
        return render;
      case 'codeCoverage':
        return code;
      default:
        return missing;
    }
  };

  return (
    <>
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
      <div className="App">
        <div className="timeLine">
          {hypotheses.length > 0 &&
            hypotheses[hypotheseUnderInvestigation].evidence.map(
              (evidence, index) => (
                <button
                  className={
                    evidence.type === 'no evidence'
                      ? 'timeLine__item__dot timeLine__item__dot--noEvidence'
                      : 'timeLine__item__dot'
                  }
                  id={index}
                  onClick={selectedDot}
                  type="button"
                >
                  <img src={getIcon(evidence.type)} alt="click" />
                  {evidence.type === 'no evidence' && (
                    <span className="timeLine__item__dot__badges">!</span>
                  )}
                </button>
              )
            )}
        </div>
        <div className="timeLine__item__box" ref={boxRef}>
          <InfoBox
            evidence={infoBoxData}
            hypotheses={hypotheses[hypotheseUnderInvestigation]}
          />
        </div>
      </div>
    </>
  );
}

export default TimeLine;

import { useRef, useState } from 'react';
import InfoBox from '../infoBox/InfoBox';
import './TimeLine.css';
import click from './icons/click.png';
import typing from './icons/typing.png';
import network from './icons/network.png';
import render from './icons/render.png';
import code from './icons/code.png';
import missing from './icons/missing.png';

function TimeLine({ hypothesis }) {
  const boxRef = useRef(null);
  const [infoBoxData, setInfoBoxData] = useState(hypothesis.evidence[0]);

  const selectedDot = (e) => {
    const id = parseInt(e.currentTarget.id, 10);
    boxRef.current.style.transform = `translateY(${id * 88 + 30}px)`;
    setInfoBoxData(hypothesis.evidence[id]);
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
      <div className="hypothesis-time-line ">
        <div className="timeLine">
          {hypothesis.evidence.map((evidence, index) => (
            <>
              <div key={`${evidence.type}-${index}`}>
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
                </button>
                {evidence.type === 'no evidence' ? (
                  <div className="timeLine__item__dot__badges">?</div>
                ) : (
                  <></>
                )}
              </div>

              <div className="timeLine__item__line" />
            </>
          ))}
        </div>
        <div className="timeLine__item__box_arrow" ref={boxRef} />
        <div className="timeLine__item__box">
          <InfoBox evidence={infoBoxData} hypotheses={hypothesis} />
        </div>
      </div>
    </>
  );
}

export default TimeLine;

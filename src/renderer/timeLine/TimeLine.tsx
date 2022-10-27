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
  const [infoBoxData, setInfoBoxData] = useState('');

  const selectedDot = (e) => {
    const dot = e.currentTarget.id;
    boxRef.current.style.transform = `translateY(${dot * 92 + 2}px)`;
    setInfoBoxData(hypotheses[dot]);
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
          <button className="timeLine__item__dot" id="0" onClick={selectedDot}>
            <img src={click} alt="click" />
            <span className="timeLine__item__dot__badges">!</span>
          </button>
          <button className="timeLine__item__dot" id={1} onClick={selectedDot}>
            <img src={typing} alt="typing" />
          </button>
          <button className="timeLine__item__dot" id={2} onClick={selectedDot}>
            <img src={network} alt="network" />
          </button>
          <button className="timeLine__item__dot" id={3} onClick={selectedDot}>
            <img src={render} alt="render" />
          </button>
          <button className="timeLine__item__dot" id={4} onClick={selectedDot}>
            <img src={code} alt="code" />
          </button>
          <button className="timeLine__item__dot" id={5} onClick={selectedDot}>
            <img src={missing} alt="missing" />
          </button>
        </div>
        <div className="timeLine__item__box" ref={boxRef}>
          <InfoBox hypotheses={hypotheses} />
        </div>
      </div>
    </>
  );
}

export default TimeLine;

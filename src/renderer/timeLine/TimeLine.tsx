import { useRef, useState } from 'react';
import InfoBox from '../infoBox/InfoBox';
import './TimeLine.css';
import click from './icons/click.png';
import typing from './icons/typing.png';
import network from './icons/network.png';
import render from './icons/render.png';
import code from './icons/code.png';
import missing from './icons/missing.png';
import request from './icons/request.png';
import response from './icons/response.png';
import mouseOver from './icons/mouseOver.png';
import mouseOut from './icons/mouseOut.png';

function TimeLine({ hypothesis }) {
  const boxRef = useRef(null);
  const [infoBoxData, setInfoBoxData] = useState(hypothesis.evidence[0]);

  const selectedDot = (e: { currentTarget: { id: string } }) => {
    const id = parseInt(e.currentTarget.id, 10);
    boxRef.current.style.transform = `translateY(${id * 88 + 30}px)`;
    setInfoBoxData(hypothesis.evidence[id]);
  };
  const getIconForDOMEvent = (type: any) => {
    switch (type) {
      case 'keydown':
        return typing;
      case 'click':
        return click;
      case 'childList':
      case 'attributes':
        return render;
      case 'mouseover':
        return mouseOver;
      case 'mouseout':
        return mouseOut;
      default:
        return missing;
    }
  };
  const getIconForNetworkEvent = (type: any) => {
    switch (type) {
      case 'requestWillBeSent':
        return request;
      case 'responseReceived':
        return response;
      default:
        return network;
    }
  };
  const getIcon = (type: any, evidence) => {
    switch (type) {
      case 'DOM_events':
        return getIconForDOMEvent(evidence.rule.objectShape.type);
      case 'Network_events':
        return getIconForNetworkEvent(evidence.rule.objectShape.type);
      case 'API_calls':
        return code;
      default:
        return missing;
    }
  };

  const getBadges = (evidence) => {
    if (evidence.DoesContainTheDefect)
      if (evidence.isFound)
        return <div className="timeLine__item__dot__badges">X</div>;
      else return <div className="timeLine__item__dot__badges">?</div>;
    return <></>;
  };

  const getTimelineItem = (
    evidence: { type: string },
    index: string | undefined
  ) => {
    return (
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
        <img src={getIcon(evidence.rule.evidenceType, evidence)} alt="click" />
      </button>
    );
  };

  return (
    <>
      <div className="hypothesis-time-line ">
        <div className="timeLine">
          {hypothesis.evidence.map(
            (evidence: { type: string }, index: string | undefined) => (
              <>
                <div key={`${evidence.type}-${index}`}>
                  {getTimelineItem(evidence, index)}
                  {getBadges(evidence)}
                </div>

                <div className="timeLine__item__line" />
              </>
            )
          )}
        </div>
        <div className="timeLine__item__box_arrow" ref={boxRef} />
        <div className="timeLine__item__box">
          <InfoBox
            evidence={infoBoxData}
            hypotheses={hypothesis}
            key={hypothesis.id}
          />
        </div>
      </div>
    </>
  );
}

export default TimeLine;

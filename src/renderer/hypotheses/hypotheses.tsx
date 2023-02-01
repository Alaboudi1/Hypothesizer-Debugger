import React, { useEffect } from 'react';
import './Hypotheses.css';
import TimeLine from '../timeLine/TimeLine';
import Tags from '../tags/Tags';

const Hypotheses: React.FC<any> = ({
  hypotheses,
  initSelectedTags,
  linkToProject,
}): JSX.Element => {
  const [showedHypotheses, setShowedHypotheses] =
    React.useState<any[]>(hypotheses);

  useEffect(() => {
    const details = document.getElementsByClassName('hypothesis');
    for (let i = 0; i < details.length; i++) {
      details[i].removeAttribute('open');
    }
  }, [showedHypotheses]);
  return (
    <div className="container">
      <div className="defectDescription">
        {showedHypotheses.length > 0 ? (
          <p className="hypothesesFound">
            🎉 We found {showedHypotheses.length} potential hypothese(s) that
            may explain what causes the bug!
          </p>
        ) : (
          <p className="hypothesesNoFound">
            🫤 We couldn't find any potential hypotheses that might explain what
            causes the bug!
          </p>
        )}
      </div>
      <div className="hypotheses">
        <Tags
          tags={hypotheses.flatMap((hypothesis) =>
            hypothesis.tags.map((tag) => ({ tag, score: hypothesis.score }))
          )}
          tagsUpdate={(tags) => {
            setShowedHypotheses(
              hypotheses.filter((hypothesis) =>
                tags.some(
                  (tag) =>
                    hypothesis.tags.includes(tag.tag) &&
                    hypothesis.score === tag.score
                )
              )
            );
          }}
          initSelectedTags={initSelectedTags}
        />
        <h3>💡 Hypotheses</h3>
        {showedHypotheses.map((hypothesis, index) => (
          <details key={Math.random()} className="hypothesis">
            <summary>
              <b>
                <i>H{index + 1}:</i>
              </b>
              <span> {hypothesis.hypothesis} </span>
              <span className="tellMeMore">Tell me more!</span>
            </summary>
            <div className="hypothesis_Description">
              <b>Description: </b>
              <p>{hypothesis.description}</p>
            </div>
            <div className="hypothesis_Evidence">
              <b>Where is what happened exactly: </b>
              <TimeLine hypothesis={hypothesis} linkToProject={linkToProject} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};

export default Hypotheses;

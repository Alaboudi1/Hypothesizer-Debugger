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
          tagsMostLikley={hypotheses
            .filter((hypothesis) => hypothesis.score === 1)
            .flatMap((hypothesis) => hypothesis.tags)
            .filter((tag, index, self) => self.indexOf(tag) === index)}
          tagsLessLikley={hypotheses
            .filter(
              (hypothesis) => hypothesis.score < 1 && hypothesis.score > 0.5
            )
            .flatMap((hypothesis) => hypothesis.tags)
            .filter((tag, index, self) => self.indexOf(tag) === index)}
          tagsUpdate={(newTags) => {
            setShowedHypotheses(
              hypotheses.filter((hypothesis) =>
                hypothesis.tags.some((tag) => newTags.includes(tag))
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

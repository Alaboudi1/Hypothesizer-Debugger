import React from 'react';

const Timeline: React.FC<any> = ({ trace, filesContent }): JSX.Element => {
  return (
    <>
      {/* create a time line */}
      <div className="timeline">
        <div className="timeline__container">
          <div className="dot">ff</div>
          <div className="content"></div>
        </div>
      </div>
    </>
  );
};

export default Timeline;

import React from 'react';
import './spinner.css';

const Spinner: React.FC<any> = ({ text }) => {
  return (
    <div className="spinner">
      <div className="spin" />
      <div className="loading">{text}</div>
    </div>
  );
};

export default Spinner;

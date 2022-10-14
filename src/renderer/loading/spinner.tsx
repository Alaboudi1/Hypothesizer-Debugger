import React from 'react';
import './spinner.css';

const Spinner: React.FC = () => {
  return (
    <div className="spinner">
      <div className="spin" />
      <div className="loading" />
    </div>
  );
};

export default Spinner;

import React from "react";
import "./ProgressBar.css";

const ProgressBar = ({ porcentaje, color = "#e73180", label }) => {
  return (
    <div className="progress-bar-container">
      <span className="progress-label">{label}</span>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${porcentaje}%`, background: color }}></div>
      </div>
      <span className="progress-percent">{porcentaje}%</span>
    </div>
  );
};

export default ProgressBar;

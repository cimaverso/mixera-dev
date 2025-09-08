import React from "react";
import "./ProgressBar.css";

const ProgressBar = ({ porcentaje, color = "#e73180", label, dataType, className = "" }) => {
  // Definir estilos según el tipo
  const getProgressStyles = () => {
    if (dataType === "lectura") {
      return {
        width: `${porcentaje}%`,
        background: 'linear-gradient(90deg, #3db54a 0%, #8cc63f 100%)',
        boxShadow: '0 4px 12px rgba(61, 181, 74, 0.5)'
      };
    } else if (dataType === "notas") {
      return {
        width: `${porcentaje}%`,
        background: 'linear-gradient(90deg, #8cc63f 0%, #3db54a 100%)',
        boxShadow: '0 4px 12px rgba(140, 198, 63, 0.5)'
      };
    } else {
      return {
        width: `${porcentaje}%`,
        background: color
      };
    }
  };

  return (
    <div 
      className={`progress-bar-container ${className}`}
      data-type={dataType}
    >
      {label && <span className="progress-label">{label}</span>}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={getProgressStyles()}
        ></div>
      </div>
      <span className="progress-percent">{porcentaje}%</span>
    </div>
  );
};

export default ProgressBar;
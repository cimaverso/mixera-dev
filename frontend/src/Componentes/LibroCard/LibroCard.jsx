import React from "react";
import "./LibroCard.css";

/**
 * Tarjeta reutilizable para catálogo y listados.
 * Props:
 * - titulo, autor, precio, portada
 * - onClick: al hacer click (navegar a detalle)
 */
const LibroCard = ({ titulo, autor, precio, portada, onClick }) => {
  return (
    <article className="libro-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="libro-card__portada">
        {/* Si no viene portada, muestra un fondo gris */}
        {portada ? (
          <img src={portada} alt={`Portada de ${titulo}`} loading="lazy" />
        ) : (
          <div className="libro-card__placeholder" />
        )}
      </div>

      <div className="libro-card__info">
        <h3 className="libro-card__titulo">{titulo}</h3>
        <p className="libro-card__autor">{autor}</p>
        <div className="libro-card__precio">${precio.toLocaleString("es-CO")}</div>
      </div>
    </article>
  );
};

export default LibroCard;

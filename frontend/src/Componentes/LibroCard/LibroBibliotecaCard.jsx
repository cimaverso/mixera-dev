import React from "react";
import "./LibroBibliotecaCard.css";

const LibroBibliotecaCard = ({
  titulo,
  autor,
  portada,
  progresoLeido = 0,
  progresoTotal = 0,
  onLeer,
}) => {
  const porcentajeLeido =
    progresoTotal > 0 ? Math.round((progresoLeido / progresoTotal) * 100) : 0;

  return (
    <article className="biblio-card">
      <div className="biblio-card__portada">
        {portada ? (
          <img src={portada} alt={`Portada de ${titulo}`} loading="lazy" />
        ) : (
          <div className="biblio-card__placeholder" />
        )}
      </div>

      <div className="biblio-card__info">
        <h3 className="biblio-card__titulo">{titulo}</h3>
        <p className="biblio-card__autor">{autor}</p>

        <div className="biblio-card__progreso">
          <div className="barra">
            <div className="barra__llena" style={{ width: `${porcentajeLeido}%` }} />
          </div>
          <span className="porcentaje">{porcentajeLeido}%</span>
        </div>

        <button className="biblio-card__cta" onClick={onLeer}>
          Seguir leyendo…
        </button>
      </div>
    </article>
  );
};

export default LibroBibliotecaCard;

// src/Componentes/Lector/BarraInferior.jsx - VERSIÃƒâ€œN SIMPLIFICADA
import React, { useState, useCallback } from 'react';
import './barraInferior.css';

/**
 * Barra de controles inferior del lector PDF simplificada
 * Solo incluye: navegaciÃƒÂ³n, zoom y pantalla completa
 */
export default function BarraInferior({ 
  paginaActual, 
  totalPaginas, 
  zoom,
  visorRef,
  onCambiarPagina,
  onCambiarZoom
}) {
  
  const [inputPagina, setInputPagina] = useState(paginaActual.toString());
  const [mostrandoZoomInput, setMostrandoZoomInput] = useState(false);

  /**
   * NavegaciÃƒÂ³n de pÃƒÂ¡ginas
   */
  const irPaginaAnterior = useCallback(() => {
    if (paginaActual > 1) {
      const nuevaPagina = paginaActual - 1;
      onCambiarPagina?.(nuevaPagina);
      setInputPagina(nuevaPagina.toString());
    }
  }, [paginaActual, onCambiarPagina]);

  const irPaginaSiguiente = useCallback(() => {
    if (paginaActual < totalPaginas) {
      const nuevaPagina = paginaActual + 1;
      onCambiarPagina?.(nuevaPagina);
      setInputPagina(nuevaPagina.toString());
    }
  }, [paginaActual, totalPaginas, onCambiarPagina]);

  const irPrimeraPagina = useCallback(() => {
    onCambiarPagina?.(1);
    setInputPagina('1');
  }, [onCambiarPagina]);

  const irUltimaPagina = useCallback(() => {
    onCambiarPagina?.(totalPaginas);
    setInputPagina(totalPaginas.toString());
  }, [totalPaginas, onCambiarPagina]);

  /**
   * Maneja el input directo de pÃƒÂ¡gina
   */
  const manejarCambioPagina = useCallback((event) => {
    if (event.key === 'Enter') {
      const numeroPagina = parseInt(inputPagina);
      if (numeroPagina >= 1 && numeroPagina <= totalPaginas) {
        onCambiarPagina?.(numeroPagina);
      } else {
        // Revertir a pÃƒÂ¡gina actual si nÃƒÂºmero invÃƒÂ¡lido
        setInputPagina(paginaActual.toString());
      }
    }
  }, [inputPagina, totalPaginas, paginaActual, onCambiarPagina]);

  /**
   * Control de zoom
   */
  const aumentarZoom = useCallback(() => {
    const nuevoZoom = Math.min(zoom * 1.25, 4);
    onCambiarZoom?.(nuevoZoom);
  }, [zoom, onCambiarZoom]);

  const reducirZoom = useCallback(() => {
    const nuevoZoom = Math.max(zoom / 1.25, 0.25);
    onCambiarZoom?.(nuevoZoom);
  }, [zoom, onCambiarZoom]);

  const ajustarZoom = useCallback((factor) => {
    onCambiarZoom?.(factor);
  }, [onCambiarZoom]);

  /**
   * Pantalla completa
   */
  const togglePantallaCompleta = useCallback(() => {
    if (!document.fullscreenElement) {
      const elemento = document.querySelector('.lector-pdf');
      if (elemento?.requestFullscreen) {
        elemento.requestFullscreen();
      }
    } else {
      document.exitFullscreen();
    }
  }, []);

  /**
   * Sincronizar input de pÃƒÂ¡gina con prop
   */
  React.useEffect(() => {
    setInputPagina(paginaActual.toString());
  }, [paginaActual]);

  /**
   * Formatear porcentaje de zoom
   */
  const porcentajeZoom = Math.round(zoom * 100);

  return (
    <div className="barra-inferior" role="toolbar" aria-label="Controles del lector">
      
      {/* Grupo: NavegaciÃƒÂ³n de pÃƒÂ¡ginas */}
      <div className="grupo-controles navegacion">
        
        {/* Primera pÃƒÂ¡gina */}
        <button 
          onClick={irPrimeraPagina}
          disabled={paginaActual <= 1}
          title="Primera pÃƒÂ¡gina (Inicio)"
          aria-label="Ir a la primera pÃƒÂ¡gina"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            <path d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
        </button>

        {/* PÃƒÂ¡gina anterior */}
        <button 
          onClick={irPaginaAnterior}
          disabled={paginaActual <= 1}
          title="PÃƒÂ¡gina anterior (Ã¢â€ Â)"
          aria-label="PÃƒÂ¡gina anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4 4a.5.5 0 0 1 1 0v3.248l6.267-3.636c.52-.302 1.233.043 1.233.696v7.384c0 .653-.713.998-1.233.696L5 8.752V12a.5.5 0 0 1-1 0zm7.5.633L5.696 8l5.804 3.367z"/>
          </svg>
        </button>

        {/* Indicador de pÃƒÂ¡gina con input */}
        <div className="pagina-info">
          <input
            type="number"
            value={inputPagina}
            onChange={(e) => setInputPagina(e.target.value)}
            onKeyDown={manejarCambioPagina}
            onBlur={() => setInputPagina(paginaActual.toString())}
            min="1"
            max={totalPaginas}
            className="input-pagina"
            aria-label="NÃƒÂºmero de pÃƒÂ¡gina actual"
          />
          <span className="separador-pagina">/</span>
          <span className="total-paginas">{totalPaginas}</span>
        </div>

        {/* PÃƒÂ¡gina siguiente */}
        <button 
          onClick={irPaginaSiguiente}
          disabled={paginaActual >= totalPaginas}
          title="PÃƒÂ¡gina siguiente (Ã¢â€ â€™)"
          aria-label="PÃƒÂ¡gina siguiente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.713 3.31 4 3.655 4 4.308v7.384c0 .653.713.998 1.233.696L11.5 8.752V12a.5.5 0 0 0 1 0zM5 4.633 10.804 8 5 11.367z"/>
          </svg>
        </button>

        {/* ÃƒÅ¡ltima pÃƒÂ¡gina */}
        <button 
          onClick={irUltimaPagina}
          disabled={paginaActual >= totalPaginas}
          title="ÃƒÅ¡ltima pÃƒÂ¡gina (Fin)"
          aria-label="Ir a la ÃƒÂºltima pÃƒÂ¡gina"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
            <path d="M8.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L14.293 8 8.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>

      {/* Separador */}
      <div className="separador-vertical"></div>

      {/* Grupo: Control de zoom */}
      <div className="grupo-controles zoom">
        
        {/* Reducir zoom */}
        <button 
          onClick={reducirZoom}
          disabled={zoom <= 0.25}
          title="Reducir zoom (-)"
          aria-label="Reducir zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
            <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
            <path fillRule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/>
          </svg>
        </button>

        {/* Indicador de zoom */}
        <div 
          className="zoom-info"
          onClick={() => setMostrandoZoomInput(!mostrandoZoomInput)}
          title="Hacer clic para ajustar zoom personalizado"
        >
          {mostrandoZoomInput ? (
            <select
              value={zoom}
              onChange={(e) => {
                ajustarZoom(parseFloat(e.target.value));
                setMostrandoZoomInput(false);
              }}
              onBlur={() => setMostrandoZoomInput(false)}
              autoFocus
              className="select-zoom"
            >
              <option value={0.25}>25%</option>
              <option value={0.5}>50%</option>
              <option value={0.75}>75%</option>
              <option value={1}>100%</option>
              <option value={1.25}>125%</option>
              <option value={1.5}>150%</option>
              <option value={2}>200%</option>
              <option value={3}>300%</option>
              <option value={4}>400%</option>
            </select>
          ) : (
            <span className="porcentaje-zoom">{porcentajeZoom}%</span>
          )}
        </div>

        {/* Aumentar zoom */}
        <button 
          onClick={aumentarZoom}
          disabled={zoom >= 4}
          title="Aumentar zoom (+)"
          aria-label="Aumentar zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
            <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
            <path fillRule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"/>
          </svg>
        </button>

        {/* Ajuste rÃƒÂ¡pido: Ajustar a 100% */}
        <button 
          onClick={() => ajustarZoom(1)}
          title="Zoom original (100%)"
          aria-label="Zoom original"
          className={zoom === 1 ? 'activo' : ''}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
          </svg>
        </button>
      </div>

      {/* Separador */}
      <div className="separador-vertical"></div>

      {/* Grupo: Pantalla completa */}
      <div className="grupo-controles adicionales">
        
        {/* Pantalla completa */}
        <button 
          onClick={togglePantallaCompleta}
          title="Pantalla completa (F11)"
          aria-label="Alternar pantalla completa"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h13A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5zM1.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5z"/>
            <path d="M2 4.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1H3v2.5a.5.5 0 0 1-1 0zm12 7a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H13V8.5a.5.5 0 0 1 1 0z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
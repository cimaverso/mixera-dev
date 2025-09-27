// src/Componentes/Lector/PanelHerramientas.jsx - VERSIÃ“N FLOTANTE MEJORADA
import React from "react";
import "./panelHerramientas.css";

/**
 * Panel de herramientas flotante minimalista del lector PDF
 * Solo incluye las herramientas esenciales: cursor y texto
 */
export default function PanelHerramientas({
  herramientaActiva,
  setHerramientaActiva,
  visorRef,
  onHerramientaCambiada,
}) {

  /**
   * DefiniciÃ³n de herramientas principales
   */
  const herramientas = [
    {
      id: "cursor",
      nombre: "Cursor",
      descripcion: "Seleccionar y mover anotaciones",
      icono: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103zM2.25 8.184l3.897 1.67a.5.5 0 0 1 .262.263l1.67 3.897L12.743 3.52z" />
        </svg>
      ),
      shortcut: "C"
    },
    {
      id: "texto",
      nombre: "Agregar Texto",
      descripcion: "Hacer clic para agregar texto",
      icono: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479z" />
        </svg>
      ),
      shortcut: "T"
    }
  ];

  /**
   * Maneja el cambio de herramienta
   */
  const manejarCambioHerramienta = (herramientaId) => {
    setHerramientaActiva(herramientaId);
    onHerramientaCambiada?.(herramientaId);
    
    console.log(`Herramienta cambiada a: ${herramientaId}`);
  };

  /**
   * Maneja atajos de teclado
   */
  React.useEffect(() => {
    const manejarTeclas = (event) => {
      // Solo activar si no se estÃ¡ editando texto
      if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
        return;
      }

      const tecla = event.key.toUpperCase();
      
      switch (tecla) {
        case 'C':
          event.preventDefault();
          manejarCambioHerramienta('cursor');
          break;
        case 'T':
          event.preventDefault();
          manejarCambioHerramienta('texto');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', manejarTeclas);
    return () => window.removeEventListener('keydown', manejarTeclas);
  }, []);

  /**
   * Renderiza una herramienta individual
   */
  const renderizarHerramienta = (herramienta) => {
    const esActiva = herramientaActiva === herramienta.id;
    
    return (
      <button
        key={herramienta.id}
        className={`herramienta-btn-flotante ${esActiva ? 'activo' : ''}`}
        onClick={() => manejarCambioHerramienta(herramienta.id)}
        title={`${herramienta.descripcion} (${herramienta.shortcut})`}
        aria-label={herramienta.nombre}
        aria-pressed={esActiva}
      >
        {herramienta.icono}
        
        {/* Etiqueta de la herramienta */}
        <span className="herramienta-label">
          {herramienta.nombre}
        </span>
        
        {/* Indicador de atajo */}
        <span className="herramienta-shortcut">
          {herramienta.shortcut}
        </span>
      </button>
    );
  };

  return (
    <div className="panel-herramientas-flotante" role="toolbar" aria-label="Herramientas de anotaciÃ³n">
      
      {/* Indicador de herramienta activa */}
      <div className="herramienta-activa-indicator">
        <div className="indicator-dot"></div>
        <span className="indicator-text">
          {herramientas.find(h => h.id === herramientaActiva)?.nombre || 'Cursor'}
        </span>
      </div>

      {/* Contenedor de herramientas */}
      <div className="herramientas-container">
        {herramientas.map(renderizarHerramienta)}
      </div>

      {/* InformaciÃ³n de atajos (solo visible en hover del panel) */}
      <div className="atajos-info-flotante">
        <div className="atajos-titulo">Atajos:</div>
        <div className="atajo-item">C - Cursor</div>
        <div className="atajo-item">T - Texto</div>
      </div>
    </div>
  );
}
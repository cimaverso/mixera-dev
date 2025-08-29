// PanelHerramientas.jsx - VERSIÓN LIMPIA SIN NOTAS
import React from "react";
import "./lector.css";

export default function PanelHerramientas({
  herramientaActiva,
  setHerramientaActiva,
  visorRef,
}) {
  console.log('🔧 PanelHerramientas render - herramientaActiva:', herramientaActiva);

  const herramientas = [
    {
      id: "cursor",
      action: () => {
        console.log('🔧 Activando cursor');
        setHerramientaActiva("cursor");
      },
      svg: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-cursor"
          viewBox="0 0 16 16"
        >
          <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103zM2.25 8.184l3.897 1.67a.5.5 0 0 1 .262.263l1.67 3.897L12.743 3.52z" />
        </svg>
      ),
    },
    {
      id: "texto",
      action: () => {
        console.log('🔧 Activando modo texto');
        const nuevoEstado = herramientaActiva === 'texto' ? 'cursor' : 'texto';
        setHerramientaActiva(nuevoEstado);
      },
      svg: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-fonts"
          viewBox="0 0 16 16"
        >
          <path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479z" />
        </svg>
      ),
    }
    // NOTA: Herramientas futuras se agregarán aquí sin romper la arquitectura
    // Ejemplos comentados para referencia futura:
    /*
    {
      id: "buscar",
      action: () => visorRef.current?.buscar && visorRef.current.buscar(),
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
        </svg>
      ),
    },
    {
      id: "subrayar",
      action: () => {
        const resultado = visorRef.current?.subrayar && visorRef.current.subrayar();
        if (resultado === true) {
          setHerramientaActiva("subrayar");
        } else if (resultado === false) {
          setHerramientaActiva("cursor");
        }
      },
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-highlighter" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M11.096.644a2 2 0 0 1 2.791.036l1.433 1.433a2 2 0 0 1 .035 2.791l-.413.435-8.07 8.995a.5.5 0 0 1-.372.166h-3a.5.5 0 0 1-.234-.058l-.412.412A.5.5 0 0 1 2.5 15h-2a.5.5 0 0 1-.354-.854l1.412-1.412A.5.5 0 0 1 1.5 12.5v-3a.5.5 0 0 1 .166-.372l8995-8.07zm-.115 1.47L2.727 9.52l3.753 3.753 7.406-8.254zm3.585 2.17.064-.068a1 1 0 0 0-.017-1.396L13.18 1.387a1 1 0 0 0-1.396-.018l-.068.065zM5.293 13.5 2.5 10.707v1.586L3.707 13.5z" />
        </svg>
      ),
    },
    {
      id: "nota",
      action: () => {
        console.log('🔧 Activando modo nota');
        const nuevoEstado = herramientaActiva === 'nota' ? 'cursor' : 'nota';
        setHerramientaActiva(nuevoEstado);
      },
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-sticky" viewBox="0 0 16 16">
          <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 15 8.586V2.5A1.5 1.5 0 0 0 13.5 1zM2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V8H9.5A1.5 1.5 0 0 0 8 9.5V14H2.5a.5.5 0 0 1-.5-.5zm7 11.293V9.5a.5.5 0 0 1 .5-.5h4.293z" />
        </svg>
      ),
    },
    {
      id: "marcador",
      action: () => visorRef.current?.marcarPagina && visorRef.current.marcarPagina(),
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-bookmark-check" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0" />
          <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z" />
        </svg>
      ),
    }
    */
  ];

  return (
    <div className="panel-herramientas">
      {herramientas.map((tool) => (
        <button
          key={tool.id}
          className={herramientaActiva === tool.id ? "activo" : ""}
          onClick={tool.action}
          title={
            tool.id === "texto"
              ? herramientaActiva === "texto"
                ? "Desactivar modo texto"
                : "Activar modo texto"
              : `Herramienta: ${tool.id}`
          }
        >
          {tool.svg}
        </button>
      ))}
    </div>
  );
}
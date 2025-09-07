// PanelHerramientas.jsx - VERSIÓN PRODUCCIÓN LIMPIA
import React from "react";
import "./lector.css";

export default function PanelHerramientas({
  herramientaActiva,
  setHerramientaActiva,
  visorRef,
}) {

  const herramientas = [
    {
      id: "cursor",
      action: () => {
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
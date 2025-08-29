import React, { useMemo, useState } from "react";
import LayoutUsuario from "../../Componentes/LayoutUsuario";
import ModalVideo from "../../Componentes/Modal/ModalVideo";
import "./Tutoriales.css";

/**
 * Página Tutoriales:
 * - Muestra tarjetas con miniatura (img.youtube.com)
 * - Al hacer click, abre ModalVideo centrado
 * - Usa LayoutUsuario con activeKey="tutoriales"
 */
const Tutoriales = () => {
  const [active, setActive] = useState("tutoriales");
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  // Lista de videos (ids extraídos de las URLs que enviaste)
  const videos = useMemo(
    () => [
      { id: "rvZ3BIYKKmQ", titulo: "1 Cómo adquirir libro" },
      { id: "jEsrsDVkuVY", titulo: "2 Navegar por el libro" },
      { id: "2AocxT8KurU", titulo: "3 Agregar notas" },
      { id: "FM38ZmsMXU0", titulo: "4 Exportar/descargar" },
      { id: "xNpJdqLb9wY", titulo: "5 Atajos y tips" },
    ],
    []
  );

  const openVideo = (video) => {
    setCurrent(video);
    setOpen(true);
  };

  const closeVideo = () => {
    setOpen(false);
    setCurrent(null);
  };

  return (
    <LayoutUsuario activeKey={active} onChange={setActive} onLogout={() => alert("Cerrar sesión…")}>
      <div className="tuts-header">
        <h1>Tutoriales</h1>
        <p className="tuts-sub">Videos cortos para aprovechar al máximo tu lector y biblioteca.</p>
      </div>

      <hr className="separador" />

      <section className="tuts-grid">
        {videos.map((v) => {
          const thumb = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`;
          return (
            <article key={v.id} className="tut-card" onClick={() => openVideo(v)} role="button" tabIndex={0}
              onKeyDown={(e)=> (e.key === "Enter" || e.key === " ") && openVideo(v)}>
              <div className="tut-thumb">
                <img src={thumb} alt={`Vista previa de ${v.titulo}`} loading="lazy" />
                <div className="tut-play">▶</div>
              </div>
              <h3 className="tut-title">{v.titulo}</h3>
            </article>
          );
        })}
      </section>

      {/* Modal */}
      <ModalVideo
        open={open}
        onClose={closeVideo}
        youtubeId={current?.id}
        title={current?.titulo}
      />
    </LayoutUsuario>
  );
};

export default Tutoriales;

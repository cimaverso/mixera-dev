import React, { useEffect } from "react";
import "./ModalVideo.css";

/**
 * Modal de video YouTube con:
 * - Cerrar con X, fondo o tecla ESC
 * - Bloquea scroll del body mientras está abierto
 * - Centrado y responsive
 */
const ModalVideo = ({ open, onClose, youtubeId, title = "Tutorial" }) => {
  // Cerrar con tecla ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Bloquear scroll body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = "");
    }
  }, [open]);

  if (!open) return null;

  // URL embed con autoplay
  const src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;

  return (
    <div className="mv-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div className="mv-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="mv-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <div className="mv-aspect">
          <iframe
            src={src}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <h3 className="mv-title">{title}</h3>
      </div>
    </div>
  );
};

export default ModalVideo;

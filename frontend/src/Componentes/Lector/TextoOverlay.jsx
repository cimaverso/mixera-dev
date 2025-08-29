// TextoOverlay.jsx
import React, { useState, useRef } from "react";
import "./lector.css";

/**
 * Overlay de texto: se coloca encima de la página PDF.
 * Los textos son visibles, editables y movibles.
 */
function TextoOverlay({
  textos,
  modoTexto,
  paginaActual,
  onAddTexto,
  onEditTexto,
  onDeleteTexto,
  onDesactivarHerramienta = () => {},
  scale = 1, // Para controlar el zoom de la página
}) {
  const [nuevo, setNuevo] = useState(null); // {x, y}
  const [textoTmp, setTextoTmp] = useState("");
  const [dragging, setDragging] = useState(null); // id del texto arrastrado
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef();

  // Edición de textos existentes
  const [editandoId, setEditandoId] = useState(null);
  const [textoEdit, setTextoEdit] = useState("");

  // Click para añadir texto nuevo
  const handleLayerClick = (e) => {
    if (!modoTexto || dragging !== null) return;
    if (e.target !== overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setNuevo({ x, y });
    setTextoTmp("");
  };

  // Añadir nuevo texto
  const handleGuardarNuevo = () => {
    if (!textoTmp.trim()) return;
    onAddTexto({
      pagina: paginaActual,
      x: nuevo.x,
      y: nuevo.y,
      texto: textoTmp,
    });
    setNuevo(null);
    setTextoTmp("");
    
    // Retrasar la desactivación para permitir que React renderice el nuevo texto
    setTimeout(() => {
      onDesactivarHerramienta();
    }, 10);
  };

  // Editar texto existente
  const handleEditar = (t) => {
    setEditandoId(t.id);
    setTextoEdit(t.texto);
  };
  
  const handleGuardarEdicion = () => {
    onEditTexto({ id: editandoId, texto: textoEdit });
    setEditandoId(null);
    setTextoEdit("");
    
    // Mismo retraso para ediciones
    setTimeout(() => {
      onDesactivarHerramienta();
    }, 10);
  };
  
  const handleEliminarTexto = (id) => {
    onDeleteTexto(id);
    setEditandoId(null);
    setTextoEdit("");
    
    // Mismo retraso para eliminaciones
    setTimeout(() => {
      onDesactivarHerramienta();
    }, 10);
  };

  // Drag & drop solo en la caja
  const handleDragStart = (id, e) => {
    e.stopPropagation();
    setDragging(id);
    const rect = overlayRef.current.getBoundingClientRect();
    const box = e.target.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - box.left) / rect.width,
      y: (e.clientY - box.top) / rect.height,
    });
    document.body.style.cursor = "grabbing";
  };

  const handleDrag = (e) => {
    if (dragging == null) return;
    const rect = overlayRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width - dragOffset.x + 0.05;
    let y = (e.clientY - rect.top) / rect.height - dragOffset.y + 0.05;
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    onEditTexto({ id: dragging, x, y });
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
    document.body.style.cursor = "";
  };

  // Listeners globales para drag
  React.useEffect(() => {
    if (dragging == null) return;
    const move = (e) => handleDrag(e);
    const up = () => handleDragEnd();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging, dragOffset]);

  return (
    <div
      ref={overlayRef}
      className="annotation-layer"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: modoTexto || dragging ? "auto" : "none",
        zIndex: 100,
        background: modoTexto ? "rgba(0,0,0,0.001)" : "transparent", // para capturar click
        transform: `scale(${1 / (scale || 1)})`,
        transformOrigin: "0 0",
      }}
      onMouseDown={modoTexto ? handleLayerClick : undefined}
    >
      {/* Textos de esta página */}
      {textos
        .filter((t) => t.pagina === paginaActual)
        .map((t) => (
          <div
            key={t.id}
            className={`text-annotation${dragging === t.id ? " moving" : ""}`}
            style={{
              position: "absolute",
              left: `${t.x * 100}%`,
              top: `${t.y * 100}%`,
              transform: "translate(-50%, -50%)",
              minWidth: 28,
              padding: 0,
              zIndex: 51,
              background: "transparent",
              border: "none",
              cursor: dragging === t.id ? "grabbing" : "pointer",
            }}
            tabIndex={0}
            onMouseDown={(e) => {
              if (!modoTexto || editandoId) return;
              handleDragStart(t.id, e);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleEditar(t);
            }}
            title="Doble clic para editar, arrastra para mover"
          >
            {editandoId === t.id ? (
              <div
                className="annotation-popup"
                style={{
                  position: "absolute",
                  top: "120%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  minWidth: 180,
                  background: "#fff",
                  border: "1px solid #2196f3",
                  borderRadius: 8,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                  padding: 10,
                  zIndex: 999,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  value={textoEdit}
                  onChange={(e) => setTextoEdit(e.target.value)}
                  autoFocus
                  placeholder="Edita el texto"
                  style={{
                    width: "100%",
                    minHeight: 36,
                    borderRadius: 4,
                    border: "1px solid #ddd",
                    padding: 6,
                    fontSize: 15,
                    resize: "vertical",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditandoId(null);
                    else if (e.key === "Enter" && e.ctrlKey) handleGuardarEdicion();
                  }}
                />
                <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                  <button
                    onClick={handleGuardarEdicion}
                    style={{ color: "#2196f3" }}
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    style={{ color: "#666" }}
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => handleEliminarTexto(t.id)}
                    style={{ color: "#e53935" }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <span
                style={{
                  fontSize: 18,
                  fontFamily: "inherit",
                  background: "transparent",
                  color: "#222",
                  padding: "1px 3px",
                  borderRadius: 4,
                  border: "1px solid transparent",
                  transition: "border 0.15s",
                }}
                className="text-annotation-content"
              >
                {t.texto}
              </span>
            )}
          </div>
        ))}

      {/* Popup para texto nuevo */}
      {nuevo && (
        <div
          className="text-annotation"
          style={{
            position: "absolute",
            left: `${nuevo.x * 100}%`,
            top: `${nuevo.y * 100}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 52,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className="annotation-popup"
            style={{
              position: "absolute",
              top: "120%",
              left: "50%",
              transform: "translateX(-50%)",
              minWidth: 180,
              background: "#fff",
              border: "1px solid #2196f3",
              borderRadius: 8,
              boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
              padding: 10,
              zIndex: 999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              value={textoTmp}
              onChange={(e) => setTextoTmp(e.target.value)}
              autoFocus
              placeholder="Texto a insertar"
              style={{
                width: "100%",
                minHeight: 36,
                borderRadius: 4,
                border: "1px solid #ddd",
                padding: 6,
                fontSize: 15,
                resize: "vertical",
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setNuevo(null);
                  onDesactivarHerramienta();
                }
                else if (e.key === "Enter" && e.ctrlKey) handleGuardarNuevo();
              }}
            />
            <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
              <button onClick={handleGuardarNuevo} style={{ color: "#2196f3" }}>
                Guardar
              </button>
              <button
                onClick={() => {
                  setNuevo(null);
                  onDesactivarHerramienta();
                }}
                style={{ color: "#666" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TextoOverlay;
// VisorPDF.jsx - VISTA DOBLE OPTIMIZADA v16
import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";

// Plugins
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { fullScreenPlugin } from "@react-pdf-viewer/full-screen";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/full-screen/lib/styles/index.css";

import "./lector.css";

const VisorPDF = forwardRef(
  (
    {
      fileUrl,
      herramientaActiva = "cursor",
      onPageChange,
      setTotalPaginas,
      onDesactivarHerramienta = () => {},
      onScaleChange = () => {},
      onModeChange = () => {},
      paginaInicial = 1,
    },
    ref
  ) => {
   

    const [mode, setMode] = useState("single");
    const [scaleSingle, setScaleSingle] = useState(1.0);
    const [scaleDual, setScaleDual] = useState(1.0);
    const [docPages, setDocPages] = useState(0);

    const [paginaActualSimple, setPaginaActualSimple] = useState(1);
    const [leftPageDual, setLeftPageDual] = useState(1);
    const [ultimaPaginaDual, setUltimaPaginaDual] = useState(1);

    const paginaPendienteSimple = useRef(null);

    const pageNavigationPluginInstance = pageNavigationPlugin();
    const zoomPluginInstance = zoomPlugin();
    const fullScreenPluginInstance = fullScreenPlugin();

    const { jumpToPreviousPage, jumpToNextPage, jumpToPage } =
      pageNavigationPluginInstance;
    const { zoomTo } = zoomPluginInstance;
    const { enterFullScreen } = fullScreenPluginInstance;

    const dualWrapRef = useRef(null);
    const canvasLeftRef = useRef(null);
    const canvasRightRef = useRef(null);
    const pdfDocRef = useRef(null);

    // ===================== NOTIFICAR CAMBIOS AL PARENT =====================

    useEffect(() => {
      if (mode === "single") {
        onScaleChange(scaleSingle);
      } else if (mode === "dual") {
        onScaleChange(scaleDual);
      }
      onModeChange(mode);
    }, [scaleSingle, scaleDual, mode, onScaleChange, onModeChange]);

    // ===================== MODO DUAL MEJORADO =====================

    useEffect(() => {
      if (mode !== "dual" || !fileUrl) return;

      (async () => {
        const pdfjsLib = window?.pdfjsLib;
        if (!pdfjsLib) return;

        if (!pdfDocRef.current) {
          const task = pdfjsLib.getDocument(fileUrl);
          const doc = await task.promise;
          pdfDocRef.current = doc;
          setDocPages(doc.numPages);
          setTotalPaginas?.(doc.numPages);
        }

        renderDualSpread(leftPageDual, scaleDual);
      })();
    }, [mode, leftPageDual, scaleDual, fileUrl]);

    const renderDualSpread = async (lp, scl) => {
      const doc = pdfDocRef.current;
      if (!doc) return;

      const left = clamp(lp, 1, doc.numPages);
      const right = left + 1 <= doc.numPages ? left + 1 : null;

      await renderPageToCanvas(doc, left, canvasLeftRef.current, scl);

      if (right && canvasRightRef.current) {
        await renderPageToCanvas(doc, right, canvasRightRef.current, scl);
        canvasRightRef.current.closest(".dual-page").style.display = "";

        // CRÍTICO: Marcar canvas con información de página para TextosLayer
        canvasRightRef.current.closest(".dual-page").dataset.pageNumber =
          right.toString();
      } else {
        canvasRightRef.current.closest(".dual-page").style.display = "none";
      }

      // CRÍTICO: Marcar canvas izquierdo también
      canvasLeftRef.current.closest(".dual-page").dataset.pageNumber =
        left.toString();

      setUltimaPaginaDual(left);
      onPageChange?.(left);

      // Notificar a TextosLayer que las páginas han cambiado
      setTimeout(() => {
        const event = new CustomEvent("dualPagesRendered", {
          detail: { leftPage: left, rightPage: right, scale: scl },
        });
        window.dispatchEvent(event);
      }, 100);
    };

    const renderPageToCanvas = async (doc, pageNumber, canvasEl, scl) => {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: scl });
      const canvas = canvasEl;
      const ctx = canvas.getContext("2d", { alpha: false });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
    };

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const snapToLeft = (p) => (p % 2 === 0 ? p - 1 : p);

    // ===================== NAVEGACIÓN CON TECLADO MEJORADA =====================

    useEffect(() => {
      if (mode !== "dual") return;

      const handleKey = (e) => {
        // Solo procesar si no hay modales abiertos
        if (document.querySelector(".modal-texto-con-fuente")) {
          return;
        }

        if (e.key === "ArrowRight") {
          e.preventDefault();
          setLeftPageDual((p) => {
            const next = snapToLeft(p) + 2;
            const maxLeft = docPages % 2 === 0 ? docPages - 1 : docPages;
            const newPage = clamp(next, 1, maxLeft);
            return newPage;
          });
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setLeftPageDual((p) => {
            const newPage = clamp(snapToLeft(p) - 2, 1, docPages);
            return newPage;
          });
        }
      };

      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [mode, docPages]);

    // ===================== CAMBIO DE MODO INTELIGENTE =====================

    const cambiarAVistaNormal = (paginaDestino) => {
      paginaPendienteSimple.current = paginaDestino || ultimaPaginaDual;
      setMode("single");

      // Notificar cambio inmediato
      onModeChange("single");
    };

    const cambiarAVistaDoble = (paginaOrigen) => {
      const nuevaPaginaIzquierda = snapToLeft(
        paginaOrigen || paginaActualSimple
      );
      setLeftPageDual(nuevaPaginaIzquierda);
      setScaleDual(1.0);
      setMode("dual");

      // Notificar cambio inmediato
      onModeChange("dual");
    };

    // ===================== ZOOM MEJORADO PARA AMBOS MODOS =====================

    const aumentarZoom = () => {
      if (mode === "dual") {
        const nuevoScale = parseFloat((scaleDual + 0.2).toFixed(2));

        setScaleDual(nuevoScale);
      } else {
        const nuevoScale = parseFloat((scaleSingle + 0.2).toFixed(2));

        setScaleSingle(nuevoScale);
        zoomTo(nuevoScale);
      }
    };

    const reducirZoom = () => {
      if (mode === "dual") {
        const nuevoScale = Math.max(
          0.3,
          parseFloat((scaleDual - 0.2).toFixed(2))
        );

        setScaleDual(nuevoScale);
      } else {
        const nuevoScale = Math.max(
          0.2,
          parseFloat((scaleSingle - 0.2).toFixed(2))
        );

        setScaleSingle(nuevoScale);
        zoomTo(nuevoScale);
      }
    };

    // ===================== API PÚBLICA MEJORADA =====================

    useImperativeHandle(ref, () => ({
      // Navegación
      prevPage: () => {
        if (mode === "dual") {
          setLeftPageDual((p) => {
            const newPage = clamp(snapToLeft(p) - 2, 1, docPages);

            return newPage;
          });
        } else {
          jumpToPreviousPage();
        }
      },

      nextPage: () => {
        if (mode === "dual") {
          setLeftPageDual((p) => {
            const next = snapToLeft(p) + 2;
            const maxLeft = docPages % 2 === 0 ? docPages - 1 : docPages;
            const newPage = clamp(next, 1, maxLeft);

            return newPage;
          });
        } else {
          jumpToNextPage();
        }
      },

      // Zoom
      zoomIn: aumentarZoom,
      zoomOut: reducirZoom,

      // Cambio de vista
      vistaUna: () => cambiarAVistaNormal(),
      vistaDoble: () => cambiarAVistaDoble(),

      // Pantalla completa
      enterFullScreen: () => {
        if (mode === "dual") {
          const el = dualWrapRef.current;
          if (el?.requestFullscreen) {
            el.requestFullscreen();
          }
        } else {
          const el = document.querySelector(".visor-pdf");
          if (el?.requestFullscreen) {
            el.requestFullscreen();
          }
        }
      },

      // Info del estado actual
      getCurrentInfo: () => ({
        mode,
        scale: mode === "single" ? scaleSingle : scaleDual,
        currentPage: mode === "single" ? paginaActualSimple : leftPageDual,
        totalPages: docPages,
        leftPage: mode === "dual" ? leftPageDual : null,
        rightPage:
          mode === "dual"
            ? leftPageDual + 1 <= docPages
              ? leftPageDual + 1
              : null
            : null,
      }),
    }));

    // ===================== EFECTOS DE NOTIFICACIÓN =====================

    // Notificar cambios de página en modo normal
    useEffect(() => {
      if (mode === "single") {
        onPageChange?.(paginaActualSimple);
      }
    }, [paginaActualSimple, mode, onPageChange]);

    // Notificar cambios de página en modo dual
    useEffect(() => {
      if (mode === "dual") {
        onPageChange?.(leftPageDual);
      }
    }, [leftPageDual, mode, onPageChange]);

    // ===================== RENDER =====================

    return (
      <div className="visor-pdf" style={{ position: "relative" }}>
        {mode === "single" ? (
          <div style={{ position: "relative", height: "100%", width: "100%" }}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer
                fileUrl={fileUrl}
                plugins={[
                  pageNavigationPluginInstance,
                  zoomPluginInstance,
                  fullScreenPluginInstance,
                ]}
                onDocumentLoad={(e) => {
                  setDocPages(e.doc.numPages);
                  setTotalPaginas?.(e.doc.numPages);

                  // LÓGICA NUEVA: Si tienes paginaInicial (por ejemplo, desde el progreso)
                  if (paginaInicial && paginaInicial > 1) {
                    jumpToPage(Math.max(0, paginaInicial - 1)); // Recuerda: jumpToPage es 0-based
                    // Limpia la página pendiente si hay
                    paginaPendienteSimple.current = null;
                  }
                  // Lógica previa: solo si no hay paginaInicial
                  else if (paginaPendienteSimple.current !== null) {
                    jumpToPage(Math.max(0, paginaPendienteSimple.current - 1));
                    paginaPendienteSimple.current = null;
                  }
                }}
                onPageChange={(e) => {
                  const curr = e.currentPage + 1;

                  setPaginaActualSimple(curr);
                }}
                defaultScale={SpecialZoomLevel.PageFit}
              />
            </Worker>
          </div>
        ) : (
          <div
            ref={dualWrapRef}
            className="dual-view-wrap"
            style={{
              position: "relative",
              userSelect: "none",
            }}
          >
            {/* Canvas izquierdo */}
            <div
              className="dual-page"
              style={{ position: "relative" }}
              data-page-side="left"
              data-page-number={leftPageDual}
            >
              <canvas
                ref={canvasLeftRef}
                className="dual-canvas"
                data-page-number={leftPageDual}
              />
              {/* Indicador de página para debugging */}
              {process.env.NODE_ENV === "development" && (
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: "4px",
                    background: "rgba(33, 150, 243, 0.8)",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                >
                  Página {leftPageDual}
                </div>
              )}
            </div>

            {/* Canvas derecho */}
            <div
              className="dual-page"
              style={{ position: "relative" }}
              data-page-side="right"
              data-page-number={leftPageDual + 1}
            >
              <canvas
                ref={canvasRightRef}
                className="dual-canvas"
                data-page-number={leftPageDual + 1}
              />
              {/* Indicador de página para debugging */}
              {process.env.NODE_ENV === "development" && (
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: "4px",
                    background: "rgba(255, 152, 0, 0.8)",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                >
                  Página{" "}
                  {leftPageDual + 1 <= docPages ? leftPageDual + 1 : "Vacía"}
                </div>
              )}
            </div>

            {/* Controles de vista doble */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0, 0, 0, 0.7)",
                color: "white",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600",
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backdropFilter: "blur(10px)",
              }}
            >
              <span>📄</span>
              <span>
                {leftPageDual}-
                {leftPageDual + 1 <= docPages ? leftPageDual + 1 : "?"}
              </span>
              <span>de {docPages}</span>
              <span
                style={{
                  marginLeft: "8px",
                  opacity: 0.8,
                  fontSize: "11px",
                }}
              >
                🔍 {Math.round(scaleDual * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Indicador de estado global */}
        {process.env.NODE_ENV === "development" && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "60px",
              background:
                mode === "dual"
                  ? "rgba(255, 152, 0, 0.9)"
                  : "rgba(33, 150, 243, 0.9)",
              color: "white",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "monospace",
              fontWeight: "bold",
              zIndex: 100,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {mode === "dual" ? "👥 DOBLE" : "📄 NORMAL"} | 🔍{" "}
            {Math.round((mode === "single" ? scaleSingle : scaleDual) * 100)}% |
            📖{" "}
            {mode === "single"
              ? paginaActualSimple
              : `${leftPageDual}-${leftPageDual + 1}`}
          </div>
        )}
      </div>
    );
  }
);

export default VisorPDF;

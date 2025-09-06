// VisorPDF.jsx - OPTIMIZADO PARA COORDENADAS Y DETECCIÓN v3
import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
  useState,
  useCallback,
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

/**
 * VisorPDF optimizado con:
 * - Mejor detección y tracking de páginas
 * - Sistema de coordenadas consistente
 * - Eventos de escala mejorados
 * - Integración optimizada con TextosLayer
 * - Manejo robusto de modo dual y simple
 */
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
    console.log('VisorPDF optimizado v3:', {
      fileUrl: fileUrl ? 'loaded' : 'empty',
      herramientaActiva,
      paginaInicial
    });

    // ===================== ESTADO LOCAL =====================
    const [mode, setMode] = useState("single");
    const [scaleSingle, setScaleSingle] = useState(1.0);
    const [scaleDual, setScaleDual] = useState(1.0);
    const [docPages, setDocPages] = useState(0);
    const [paginaActualSimple, setPaginaActualSimple] = useState(paginaInicial);
    const [leftPageDual, setLeftPageDual] = useState(1);
    const [ultimaPaginaDual, setUltimaPaginaDual] = useState(1);
    const [pdfListo, setPdfListo] = useState(false);

    // Referencias
    const paginaPendienteSimple = useRef(null);
    const dualWrapRef = useRef(null);
    const canvasLeftRef = useRef(null);
    const canvasRightRef = useRef(null);
    const pdfDocRef = useRef(null);
    const scaleObserverRef = useRef(null);
    const pageObserverRef = useRef(null);

    // Plugins
    const pageNavigationPluginInstance = pageNavigationPlugin();
    const zoomPluginInstance = zoomPlugin();
    const fullScreenPluginInstance = fullScreenPlugin();

    const { jumpToPreviousPage, jumpToNextPage, jumpToPage } =
      pageNavigationPluginInstance;
    const { zoomTo } = zoomPluginInstance;
    const { enterFullScreen } = fullScreenPluginInstance;

    // ===================== DETECCIÓN DE PÁGINAS MEJORADA =====================
    
    /**
     * Busca y monitorea páginas del PDF con estrategias múltiples
     */
    const detectarPaginas = useCallback(() => {
      try {
        // Estrategias de detección ordenadas por prioridad
        const estrategias = [
          () => document.querySelectorAll('.rpv-core__inner-page[aria-label^="Page "]'),
          () => document.querySelectorAll('.rpv-core__inner-page'),
          () => document.querySelectorAll('[data-testid="core__page-layer"]'),
          () => document.querySelectorAll('.rpv-core__page-layer'),
        ];

        let paginasEncontradas = [];
        let estrategiaExitosa = null;

        for (const [index, estrategia] of estrategias.entries()) {
          try {
            const paginas = Array.from(estrategia());
            const paginasValidas = paginas.filter(pagina => {
              const rect = pagina.getBoundingClientRect();
              return rect.width > 50 && rect.height > 50; // Páginas con dimensiones válidas
            });

            if (paginasValidas.length > 0) {
              paginasEncontradas = paginasValidas;
              estrategiaExitosa = index;
              break;
            }
          } catch (error) {
            console.warn(`Estrategia ${index} falló:`, error);
          }
        }

        if (paginasEncontradas.length > 0) {
          console.log(`Páginas detectadas con estrategia ${estrategiaExitosa}:`, paginasEncontradas.length);
          
          // Verificar que las páginas tienen los atributos necesarios
          const paginasConAtributos = paginasEncontradas.map((pagina, index) => {
            if (!pagina.getAttribute('aria-label')) {
              pagina.setAttribute('aria-label', `Page ${index + 1}`);
            }
            return pagina;
          });

          return paginasConAtributos;
        }

        return [];
      } catch (error) {
        console.error('Error detectando páginas:', error);
        return [];
      }
    }, []);

    /**
     * Obtiene información detallada de escala actual
     */
    const obtenerInfoEscala = useCallback(() => {
      try {
        if (mode === 'dual') {
          return {
            scale: scaleDual,
            mode: 'dual',
            found: true
          };
        }

        // Para modo simple, detectar escala real del visor
        const canvas = document.querySelector('.rpv-core__canvas-layer canvas');
        const page = document.querySelector('.rpv-core__inner-page');
        
        if (!canvas || !page) {
          return {
            scale: scaleSingle,
            mode: 'single',
            found: false
          };
        }

        const canvasRect = canvas.getBoundingClientRect();
        const pageRect = page.getBoundingClientRect();
        
        // Calcular escala real basada en el canvas
        const realScale = canvasRect.width / canvas.width;
        
        return {
          scale: realScale,
          mode: 'single',
          pageWidth: pageRect.width,
          pageHeight: pageRect.height,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          found: true
        };
      } catch (error) {
        console.warn('Error obteniendo info de escala:', error);
        return {
          scale: mode === 'single' ? scaleSingle : scaleDual,
          mode,
          found: false
        };
      }
    }, [mode, scaleSingle, scaleDual]);

    // ===================== OBSERVERS PARA CAMBIOS =====================
    
    /**
     * Configura observers para detectar cambios en páginas y escala
     */
    const configurarObservers = useCallback(() => {
      // Limpiar observers anteriores
      if (scaleObserverRef.current) {
        scaleObserverRef.current.disconnect();
      }
      if (pageObserverRef.current) {
        pageObserverRef.current.disconnect();
      }

      try {
        const viewer = document.querySelector('.rpv-core__viewer');
        if (!viewer) {
          console.warn('Viewer no encontrado para observers');
          return;
        }

        // Observer para cambios de escala
        scaleObserverRef.current = new MutationObserver((mutations) => {
          let scaleChanged = false;
          
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'style' &&
                mutation.target.style.transform) {
              scaleChanged = true;
            }
          });

          if (scaleChanged) {
            const info = obtenerInfoEscala();
            if (info.found && Math.abs(info.scale - (mode === 'single' ? scaleSingle : scaleDual)) > 0.1) {
              console.log('Cambio de escala detectado:', info.scale.toFixed(3));
              
              if (mode === 'single') {
                setScaleSingle(info.scale);
              }
              
              // Notificar cambio al padre
              onScaleChange(info.scale);
            }
          }
        });

        // Observer para nuevas páginas
        pageObserverRef.current = new MutationObserver((mutations) => {
          let shouldCheckPages = false;
          
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              Array.from(mutation.addedNodes).forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE &&
                    (node.classList?.contains('rpv-core__inner-page') ||
                     node.querySelector?.('.rpv-core__inner-page'))) {
                  shouldCheckPages = true;
                }
              });
            }
          });

          if (shouldCheckPages) {
            setTimeout(() => {
              const paginas = detectarPaginas();
              if (paginas.length > 0) {
                console.log('Nuevas páginas detectadas:', paginas.length);
                // Disparar evento personalizado para notificar a TextosLayer
                window.dispatchEvent(new CustomEvent('paginasActualizadas', {
                  detail: { 
                    paginas: paginas.length,
                    mode: mode
                  }
                }));
              }
            }, 100);
          }
        });

        // Configurar observers
        scaleObserverRef.current.observe(viewer, {
          attributes: true,
          attributeFilter: ['style'],
          subtree: true
        });

        pageObserverRef.current.observe(viewer, {
          childList: true,
          subtree: true
        });

        console.log('Observers configurados exitosamente');
      } catch (error) {
        console.error('Error configurando observers:', error);
      }
    }, [mode, scaleSingle, scaleDual, obtenerInfoEscala, onScaleChange, detectarPaginas]);

    // ===================== NOTIFICACIONES AL PADRE =====================

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
        canvasRightRef.current.closest(".dual-page").dataset.pageNumber = right.toString();
      } else {
        canvasRightRef.current.closest(".dual-page").style.display = "none";
      }

      canvasLeftRef.current.closest(".dual-page").dataset.pageNumber = left.toString();

      setUltimaPaginaDual(left);
      onPageChange?.(left);

      // Notificar páginas duales renderizadas
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
        if (document.querySelector(".modal-texto-optimizado")) {
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

    const cambiarAVistaNormal = useCallback((paginaDestino) => {
      console.log('Cambiando a vista normal, página:', paginaDestino || ultimaPaginaDual);
      paginaPendienteSimple.current = paginaDestino || ultimaPaginaDual;
      setMode("single");
      onModeChange("single");
    }, [ultimaPaginaDual, onModeChange]);

    const cambiarAVistaDoble = useCallback((paginaOrigen) => {
      console.log('Cambiando a vista doble, página origen:', paginaOrigen || paginaActualSimple);
      const nuevaPaginaIzquierda = snapToLeft(paginaOrigen || paginaActualSimple);
      setLeftPageDual(nuevaPaginaIzquierda);
      setScaleDual(1.0);
      setMode("dual");
      onModeChange("dual");
    }, [paginaActualSimple, onModeChange]);

    // ===================== ZOOM MEJORADO PARA AMBOS MODOS =====================

    const aumentarZoom = useCallback(() => {
      if (mode === "dual") {
        const nuevoScale = parseFloat((scaleDual + 0.2).toFixed(2));
        setScaleDual(nuevoScale);
        onScaleChange(nuevoScale);
      } else {
        const nuevoScale = parseFloat((scaleSingle + 0.2).toFixed(2));
        setScaleSingle(nuevoScale);
        zoomTo(nuevoScale);
        onScaleChange(nuevoScale);
      }
    }, [mode, scaleDual, scaleSingle, zoomTo, onScaleChange]);

    const reducirZoom = useCallback(() => {
      if (mode === "dual") {
        const nuevoScale = Math.max(0.3, parseFloat((scaleDual - 0.2).toFixed(2)));
        setScaleDual(nuevoScale);
        onScaleChange(nuevoScale);
      } else {
        const nuevoScale = Math.max(0.2, parseFloat((scaleSingle - 0.2).toFixed(2)));
        setScaleSingle(nuevoScale);
        zoomTo(nuevoScale);
        onScaleChange(nuevoScale);
      }
    }, [mode, scaleDual, scaleSingle, zoomTo, onScaleChange]);

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
        pdfListo
      }),

      // Nuevas funciones para integración con TextosLayer
      detectarPaginas,
      obtenerInfoEscala,
      getPdfDocument: () => pdfDocRef.current
    }));

    // ===================== EFECTOS DE NOTIFICACIÓN =====================

    useEffect(() => {
      if (mode === "single") {
        onPageChange?.(paginaActualSimple);
      }
    }, [paginaActualSimple, mode, onPageChange]);

    useEffect(() => {
      if (mode === "dual") {
        onPageChange?.(leftPageDual);
      }
    }, [leftPageDual, mode, onPageChange]);

    // ===================== CONFIGURACIÓN DE OBSERVERS =====================

    useEffect(() => {
      if (pdfListo && mode === 'single') {
        const timer = setTimeout(() => {
          configurarObservers();
        }, 500);
        
        return () => {
          clearTimeout(timer);
          if (scaleObserverRef.current) {
            scaleObserverRef.current.disconnect();
          }
          if (pageObserverRef.current) {
            pageObserverRef.current.disconnect();
          }
        };
      }
    }, [pdfListo, mode, configurarObservers]);

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
                  console.log('Documento PDF cargado:', {
                    numPages: e.doc.numPages,
                    paginaInicial
                  });
                  
                  setDocPages(e.doc.numPages);
                  setTotalPaginas?.(e.doc.numPages);
                  setPdfListo(true);

                  // Configurar página inicial
                  if (paginaInicial && paginaInicial > 1) {
                    setTimeout(() => {
                      jumpToPage(Math.max(0, paginaInicial - 1));
                      setPaginaActualSimple(paginaInicial);
                    }, 200);
                    paginaPendienteSimple.current = null;
                  } else if (paginaPendienteSimple.current !== null) {
                    setTimeout(() => {
                      jumpToPage(Math.max(0, paginaPendienteSimple.current - 1));
                      setPaginaActualSimple(paginaPendienteSimple.current);
                    }, 200);
                    paginaPendienteSimple.current = null;
                  }

                  // Disparar evento de PDF listo
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('pdfListo', {
                      detail: { 
                        totalPages: e.doc.numPages,
                        mode: 'single'
                      }
                    }));
                  }, 300);
                }}
                onPageChange={(e) => {
                  const curr = e.currentPage + 1;
                  console.log('Cambio de página detectado:', curr);
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

        {/* Indicador de estado global optimizado */}
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
            {mode === "dual" ? "💥 DOBLE" : "📄 NORMAL"} | 🔍{" "}
            {Math.round((mode === "single" ? scaleSingle : scaleDual) * 100)}% |
            📖{" "}
            {mode === "single"
              ? paginaActualSimple
              : `${leftPageDual}-${leftPageDual + 1}`} |
            🎯 {herramientaActiva} |
            📡 {pdfListo ? 'LISTO' : 'CARGANDO'}
          </div>
        )}
      </div>
    );
  }
);

export default VisorPDF;
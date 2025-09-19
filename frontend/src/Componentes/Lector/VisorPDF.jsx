// VisorPDF.jsx - VERSIÃ“N CON MEJORAS MÃ“VILES INTEGRADAS
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

import { useMobileDetection } from "./hooks/useMobileDetection";
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

    // ===================== DETECCIÃ“N MÃ“VIL =====================
    const { 
      isMobile, 
      isTouch, 
      shouldUseNativeGestures, 
      needsCompactUI,
      isMobileLandscape,
      orientation 
    } = useMobileDetection();

    // ===================== CONFIGURACIÃ“N DE ZOOM ADAPTATIVA =====================
    const ZOOM_CONFIG = {
      MIN: isMobile ? 0.5 : 1.0,
      MAX: isMobile ? 4.0 : 2.8,
      STEP: isMobile ? 0.25 : 0.15,
      DEFAULT: isMobile ? (orientation === 'landscape' ? 0.8 : 1.0) : 1.2,
      DEBOUNCE: isMobile ? 100 : 150,
      SYNC_DELAY: isMobile ? 30 : 50,
      MOBILE_FIT: isMobile // Usar PageFit en mÃ³vil si es necesario
    };

    // ===================== ESTADO LOCAL ADAPTADO =====================
    const [mode, setMode] = useState("single");
    const [scaleSingle, setScaleSingle] = useState(ZOOM_CONFIG.DEFAULT);
    const [scaleDual, setScaleDual] = useState(ZOOM_CONFIG.DEFAULT);
    const [docPages, setDocPages] = useState(0);
    const [paginaActualSimple, setPaginaActualSimple] = useState(paginaInicial);
    const [leftPageDual, setLeftPageDual] = useState(1);
    const [ultimaPaginaDual, setUltimaPaginaDual] = useState(1);
    const [pdfListo, setPdfListo] = useState(false);
    const [aplicandoZoom, setAplicandoZoom] = useState(false);
    
    // NUEVO: Estado para gestos mÃ³viles
    const [nativeGesturesEnabled, setNativeGesturesEnabled] = useState(shouldUseNativeGestures);
    const [mobileZoomBlocked, setMobileZoomBlocked] = useState(false);

    // Referencias mejoradas
    const paginaPendienteSimple = useRef(null);
    const dualWrapRef = useRef(null);
    const canvasLeftRef = useRef(null);
    const canvasRightRef = useRef(null);
    const pdfDocRef = useRef(null);
    const zoomTimeoutRef = useRef(null);
    const escalaAnteriorRef = useRef(ZOOM_CONFIG.DEFAULT);
    const notificacionPendienteRef = useRef(null);
    const viewerRef = useRef(null); // NUEVO: Ref para el viewer

    // ===================== PLUGINS CON CONFIGURACIÃ“N ADAPTATIVA =====================
    const pageNavigationPluginInstance = pageNavigationPlugin();
    const zoomPluginInstance = zoomPlugin();
    const fullScreenPluginInstance = fullScreenPlugin();

    const { jumpToPreviousPage, jumpToNextPage, jumpToPage } = pageNavigationPluginInstance;
    const { zoomTo } = zoomPluginInstance;
    const { enterFullScreen } = fullScreenPluginInstance;

    // ===================== CONFIGURACIÃ“N TÃCTIL PARA MÃ“VIL =====================
    useEffect(() => {
      if (!isMobile) return;

      const configurarGestosTactiles = () => {
        const viewer = document.querySelector('.visor-pdf');
        const rpvViewer = document.querySelector('.rpv-core__viewer');
        
        if (viewer && shouldUseNativeGestures) {
          console.log('ðŸ”§ Configurando gestos tÃ¡ctiles nativos para mÃ³vil');
          
          // Habilitar zoom tÃ¡ctil nativo
          viewer.style.touchAction = 'pinch-zoom pan-x pan-y';
          if (rpvViewer) {
            rpvViewer.style.touchAction = 'pinch-zoom pan-x pan-y';
          }
          
          // Configurar viewport meta para zoom
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content', 
              'width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes'
            );
          }
          
          setNativeGesturesEnabled(true);
          
          // Detectar gestos de zoom para sincronizar
          let lastScale = 1;
          const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
              setMobileZoomBlocked(true);
              const touch1 = e.touches[0];
              const touch2 = e.touches[1];
              const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
              );
              lastScale = distance;
            }
          };
          
          const handleTouchMove = (e) => {
            if (e.touches.length === 2 && mobileZoomBlocked) {
              const touch1 = e.touches[0];
              const touch2 = e.touches[1];
              const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
              );
              
              const scaleChange = distance / lastScale;
              lastScale = distance;
              
              // Notificar cambio de escala estimado
              if (Math.abs(scaleChange - 1) > 0.1) {
                const newScale = Math.max(ZOOM_CONFIG.MIN, 
                  Math.min(ZOOM_CONFIG.MAX, scaleSingle * scaleChange));
                notificarCambioEscala(newScale, true);
              }
            }
          };
          
          const handleTouchEnd = (e) => {
            if (e.touches.length < 2) {
              setMobileZoomBlocked(false);
            }
          };
          
          viewer.addEventListener('touchstart', handleTouchStart, { passive: true });
          viewer.addEventListener('touchmove', handleTouchMove, { passive: true });
          viewer.addEventListener('touchend', handleTouchEnd, { passive: true });
          
          return () => {
            viewer.removeEventListener('touchstart', handleTouchStart);
            viewer.removeEventListener('touchmove', handleTouchMove);
            viewer.removeEventListener('touchend', handleTouchEnd);
          };
        } else if (viewer) {
          // ConfiguraciÃ³n para desktop
          viewer.style.touchAction = 'none';
          if (rpvViewer) {
            rpvViewer.style.touchAction = 'none';
          }
        }
      };

      // Configurar despuÃ©s de que el PDF estÃ© listo
      const timer = setTimeout(configurarGestosTactiles, 500);
      return () => clearTimeout(timer);
    }, [isMobile, shouldUseNativeGestures, scaleSingle, ZOOM_CONFIG, mobileZoomBlocked]);

    // ===================== VALIDACIÃ“N DE ESCALA ADAPTADA =====================
    const validarEscala = useCallback((nuevaEscala) => {
      const escalaLimpia = parseFloat(nuevaEscala);
      if (!escalaLimpia || isNaN(escalaLimpia)) {
        console.warn('âš ï¸ Escala invÃ¡lida, usando default:', nuevaEscala);
        return ZOOM_CONFIG.DEFAULT;
      }
      return Math.max(ZOOM_CONFIG.MIN, Math.min(ZOOM_CONFIG.MAX, escalaLimpia));
    }, [ZOOM_CONFIG]);

    // ===================== NOTIFICACIÃ“N DE ESCALA OPTIMIZADA =====================
    const notificarCambioEscala = useCallback((nuevaEscala, forceNotify = false) => {
      const escalaValida = validarEscala(nuevaEscala);
      const cambioSignificativo = Math.abs(escalaValida - escalaAnteriorRef.current) >= 
        (isMobile ? 0.05 : 0.03);
      
      if (cambioSignificativo || forceNotify) {
        if (notificacionPendienteRef.current) {
          clearTimeout(notificacionPendienteRef.current);
        }
        
        notificacionPendienteRef.current = setTimeout(() => {
          console.log(`ðŸ“± Notificando cambio de escala (${isMobile ? 'mÃ³vil' : 'desktop'}): ${escalaAnteriorRef.current.toFixed(2)} â†’ ${escalaValida.toFixed(2)}`);
          
          onScaleChange(escalaValida);
          escalaAnteriorRef.current = escalaValida;
          
          notificacionPendienteRef.current = null;
        }, ZOOM_CONFIG.SYNC_DELAY);
      }
    }, [validarEscala, onScaleChange, ZOOM_CONFIG.SYNC_DELAY, isMobile]);

    // ===================== ZOOM ADAPTATIVO MÃ“VIL/DESKTOP =====================
    const aplicarZoomSeguro = useCallback((nuevaEscala, forceUpdate = false) => {
      // En mÃ³vil con gestos nativos, no aplicar zoom programÃ¡tico durante gestos
      if (isMobile && nativeGesturesEnabled && mobileZoomBlocked && !forceUpdate) {
        console.log('ðŸ“± Zoom programÃ¡tico bloqueado durante gesto tÃ¡ctil');
        return;
      }
      
      const escalaValida = validarEscala(nuevaEscala);
      
      const cambioMinimo = Math.abs(escalaValida - escalaAnteriorRef.current) >= 
        (isMobile ? 0.05 : 0.03);
      if (!cambioMinimo && !forceUpdate) {
        return;
      }
      
      console.log(`ðŸ“± Aplicando zoom (${isMobile ? 'mÃ³vil' : 'desktop'}): ${escalaAnteriorRef.current.toFixed(2)} â†’ ${escalaValida.toFixed(2)}`);
      
      setAplicandoZoom(true);
      
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      
      zoomTimeoutRef.current = setTimeout(() => {
        try {
          if (mode === 'single') {
            // En mÃ³vil, usar el zoom del plugin solo si no hay gestos nativos activos
            if (!isMobile || !nativeGesturesEnabled || forceUpdate) {
              zoomTo(escalaValida);
            }
            setScaleSingle(escalaValida);
          } else {
            setScaleDual(escalaValida);
          }
          
          setTimeout(() => {
            notificarCambioEscala(escalaValida, true);
            setAplicandoZoom(false);
          }, ZOOM_CONFIG.SYNC_DELAY);
          
        } catch (error) {
          console.error('âŒ Error aplicando zoom:', error);
          setAplicandoZoom(false);
        }
      }, ZOOM_CONFIG.DEBOUNCE);
      
    }, [mode, zoomTo, validarEscala, notificarCambioEscala, ZOOM_CONFIG, isMobile, nativeGesturesEnabled, mobileZoomBlocked]);

    // ===================== FUNCIONES DE ZOOM ADAPTADAS =====================
    const aumentarZoom = useCallback(() => {
      if (aplicandoZoom) {
        console.log('â³ Zoom en progreso, ignorando aumento');
        return;
      }
      
      // En mÃ³vil, usar gestos nativos como prioridad
      if (isMobile && nativeGesturesEnabled) {
        console.log('ðŸ“± Usar gestos tÃ¡ctiles para zoom en mÃ³vil');
        return;
      }
      
      const escalaActual = mode === "single" ? scaleSingle : scaleDual;
      const nuevaEscala = validarEscala(escalaActual + ZOOM_CONFIG.STEP);
      
      console.log(`ðŸ”âž• Aumentando zoom: ${escalaActual.toFixed(2)} â†’ ${nuevaEscala.toFixed(2)}`);
      
      if (nuevaEscala >= ZOOM_CONFIG.MAX - 0.05) {
        console.log('âš ï¸ LÃ­mite mÃ¡ximo de zoom alcanzado');
      }
      
      aplicarZoomSeguro(nuevaEscala, true);
    }, [mode, scaleSingle, scaleDual, aplicandoZoom, aplicarZoomSeguro, validarEscala, ZOOM_CONFIG, isMobile, nativeGesturesEnabled]);

    const reducirZoom = useCallback(() => {
      if (aplicandoZoom) {
        console.log('â³ Zoom en progreso, ignorando reducciÃ³n');
        return;
      }
      
      // En mÃ³vil, usar gestos nativos como prioridad
      if (isMobile && nativeGesturesEnabled) {
        console.log('ðŸ“± Usar gestos tÃ¡ctiles para zoom en mÃ³vil');
        return;
      }
      
      const escalaActual = mode === "single" ? scaleSingle : scaleDual;
      const nuevaEscala = validarEscala(escalaActual - ZOOM_CONFIG.STEP);
      
      console.log(`ðŸ”âž– Reduciendo zoom: ${escalaActual.toFixed(2)} â†’ ${nuevaEscala.toFixed(2)}`);
      
      if (nuevaEscala <= ZOOM_CONFIG.MIN + 0.05) {
        console.log('âš ï¸ LÃ­mite mÃ­nimo de zoom alcanzado');
      }
      
      aplicarZoomSeguro(nuevaEscala, true);
    }, [mode, scaleSingle, scaleDual, aplicandoZoom, aplicarZoomSeguro, validarEscala, ZOOM_CONFIG, isMobile, nativeGesturesEnabled]);

    // ===================== DOBLE TAP PARA ZOOM (MÃ“VIL) =====================
    useEffect(() => {
      if (!isMobile || !isTouch) return;

      let lastTap = 0;
      let tapTimeout = null;

      const handleDoubleTap = (e) => {
        const now = Date.now();
        const timeDiff = now - lastTap;

        if (timeDiff < 300 && timeDiff > 0) {
          // Doble tap detectado
          e.preventDefault();
          
          const viewer = document.querySelector('.rpv-core__viewer');
          if (viewer) {
            const currentScale = scaleSingle;
            let targetScale;
            
            // Alternar entre escalas predefinidas
            if (currentScale < 1.2) {
              targetScale = 1.5; // Zoom in
            } else if (currentScale < 2.0) {
              targetScale = 2.5; // More zoom
            } else {
              targetScale = 1.0; // Reset
            }
            
            console.log('ðŸ“± Doble tap para zoom:', targetScale);
            aplicarZoomSeguro(targetScale, true);
          }
          
          lastTap = 0; // Reset
        } else {
          lastTap = now;
          
          // Clear any existing timeout
          if (tapTimeout) {
            clearTimeout(tapTimeout);
          }
          
          // Set timeout to reset lastTap
          tapTimeout = setTimeout(() => {
            lastTap = 0;
          }, 300);
        }
      };

      const viewer = document.querySelector('.visor-pdf');
      if (viewer) {
        viewer.addEventListener('touchend', handleDoubleTap, { passive: false });
        
        return () => {
          viewer.removeEventListener('touchend', handleDoubleTap);
          if (tapTimeout) {
            clearTimeout(tapTimeout);
          }
        };
      }
    }, [isMobile, isTouch, scaleSingle, aplicarZoomSeguro]);

    // ===================== NAVEGACIÃ“N MÃ“VIL MEJORADA =====================
    useEffect(() => {
      if (!isMobile || !isTouch || mode !== "single") return;

      let startX = 0;
      let startY = 0;
      let isDragging = false;

      const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          isDragging = false;
        }
      };

      const handleTouchMove = (e) => {
        if (e.touches.length === 1) {
          const deltaX = Math.abs(e.touches[0].clientX - startX);
          const deltaY = Math.abs(e.touches[0].clientY - startY);
          
          if (deltaX > 10 || deltaY > 10) {
            isDragging = true;
          }
        }
      };

      const handleTouchEnd = (e) => {
        if (e.touches.length === 0 && !isDragging) {
          const deltaX = e.changedTouches[0].clientX - startX;
          const deltaY = Math.abs(e.changedTouches[0].clientY - startY);
          
          // Swipe horizontal para cambiar pÃ¡gina
          if (Math.abs(deltaX) > 100 && deltaY < 50) {
            if (deltaX > 0) {
              // Swipe derecha - pÃ¡gina anterior
              jumpToPreviousPage();
            } else {
              // Swipe izquierda - pÃ¡gina siguiente
              jumpToNextPage();
            }
          }
        }
      };

      const viewer = document.querySelector('.rpv-core__viewer');
      if (viewer) {
        viewer.addEventListener('touchstart', handleTouchStart, { passive: true });
        viewer.addEventListener('touchmove', handleTouchMove, { passive: true });
        viewer.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        return () => {
          viewer.removeEventListener('touchstart', handleTouchStart);
          viewer.removeEventListener('touchmove', handleTouchMove);
          viewer.removeEventListener('touchend', handleTouchEnd);
        };
      }
    }, [isMobile, isTouch, mode, jumpToPreviousPage, jumpToNextPage]);

    // ===================== RESTO DE FUNCIONES SIN CAMBIOS =====================
    
    const handlePageChangeSafe = useCallback((page) => {
      if (aplicandoZoom) {
        console.log('â³ Zoom en progreso, posponiendo cambio de pÃ¡gina');
        setTimeout(() => handlePageChangeSafe(page), 100);
        return;
      }
      
      if (page !== paginaActualSimple && page > 0 && page <= docPages) {
        console.log(`ðŸ“„ Cambiando a pÃ¡gina: ${page}`);
        setPaginaActualSimple(page);
        onPageChange?.(page);
      }
    }, [paginaActualSimple, docPages, onPageChange, aplicandoZoom]);

    // ===================== GESTIÃ“N DE MODO DUAL (SIN CAMBIOS) =====================
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
      } else if (canvasRightRef.current) {
        canvasRightRef.current.closest(".dual-page").style.display = "none";
      }

      if (canvasLeftRef.current) {
        canvasLeftRef.current.closest(".dual-page").dataset.pageNumber = left.toString();
      }

      setUltimaPaginaDual(left);
      onPageChange?.(left);
    };

    const renderPageToCanvas = async (doc, pageNumber, canvasEl, scl) => {
      if (!canvasEl) return;
      
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

    // ===================== NAVEGACIÃ“N CON TECLADO PARA MODO DUAL =====================
    useEffect(() => {
      if (mode !== "dual" || isMobile) return; // Deshabilitar en mÃ³vil

      const handleKey = (e) => {
        if (document.querySelector(".texto-modal-robusto") || aplicandoZoom) {
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
    }, [mode, docPages, aplicandoZoom, isMobile]);

    // ===================== CAMBIO DE MODO CON PRESERVACIÃ“N DE ESCALA =====================
    const cambiarAVistaNormal = useCallback((paginaDestino) => {
      console.log('ðŸ“„ Cambiando a vista normal');
      
      const paginaTarget = paginaDestino || ultimaPaginaDual;
      paginaPendienteSimple.current = paginaTarget;
      
      const escalaActual = scaleDual;
      setScaleSingle(escalaActual);
      
      setMode("single");
      onModeChange("single");
      
      setTimeout(() => {
        notificarCambioEscala(escalaActual, true);
      }, ZOOM_CONFIG.SYNC_DELAY * 2);
      
    }, [ultimaPaginaDual, scaleDual, onModeChange, notificarCambioEscala, ZOOM_CONFIG.SYNC_DELAY]);

    const cambiarAVistaDoble = useCallback((paginaOrigen) => {
      // Deshabilitar vista doble en mÃ³vil
      if (isMobile) {
        console.log('ðŸ“± Vista doble deshabilitada en mÃ³vil');
        return;
      }
      
      console.log('ðŸ“„ Cambiando a vista doble');
      
      const nuevaPaginaIzquierda = snapToLeft(paginaOrigen || paginaActualSimple);
      setLeftPageDual(nuevaPaginaIzquierda);
      
      const escalaActual = scaleSingle;
      setScaleDual(escalaActual);
      
      setMode("dual");
      onModeChange("dual");
      
      setTimeout(() => {
        notificarCambioEscala(escalaActual, true);
      }, ZOOM_CONFIG.SYNC_DELAY * 2);
      
    }, [paginaActualSimple, scaleSingle, onModeChange, notificarCambioEscala, ZOOM_CONFIG.SYNC_DELAY, isMobile]);

    // ===================== INICIALIZACIÃ“N ADAPTADA =====================
    const inicializarVisor = useCallback((e) => {
      const totalPaginas = e.doc.numPages;
      setDocPages(totalPaginas);
      setTotalPaginas?.(totalPaginas);
      setPdfListo(true);

      console.log(`ðŸ“š PDF cargado: ${totalPaginas} pÃ¡ginas (${isMobile ? 'mÃ³vil' : 'desktop'})`);

      // Configurar pÃ¡gina inicial
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

      // Aplicar zoom inicial adaptado
      setTimeout(() => {
        aplicarZoomSeguro(ZOOM_CONFIG.DEFAULT, true);
      }, 300);

      // Disparar evento de PDF listo
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('pdfListo', {
          detail: { 
            totalPages: totalPaginas,
            mode: 'single',
            escalaInicial: ZOOM_CONFIG.DEFAULT,
            isMobile,
            nativeGestures: nativeGesturesEnabled
          }
        }));
      }, 400);
      
    }, [paginaInicial, jumpToPage, setTotalPaginas, aplicarZoomSeguro, ZOOM_CONFIG.DEFAULT, isMobile, nativeGesturesEnabled]);

    // ===================== API PÃšBLICA ADAPTADA =====================
    useImperativeHandle(ref, () => ({
      // NavegaciÃ³n
      prevPage: () => {
        if (aplicandoZoom) {
          console.log('â³ Zoom en progreso, ignorando navegaciÃ³n');
          return;
        }
        
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
        if (aplicandoZoom) {
          console.log('â³ Zoom en progreso, ignorando navegaciÃ³n');
          return;
        }
        
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

      // Zoom adaptativo
      zoomIn: () => {
        if (isMobile && nativeGesturesEnabled) {
          console.log('ðŸ“± Usar gestos tÃ¡ctiles para zoom');
          return;
        }
        aumentarZoom();
      },
      zoomOut: () => {
        if (isMobile && nativeGesturesEnabled) {
          console.log('ðŸ“± Usar gestos tÃ¡ctiles para zoom');
          return;
        }
        reducirZoom();
      },

      // Cambio de vista (deshabilitar doble en mÃ³vil)
      vistaUna: () => cambiarAVistaNormal(),
      vistaDoble: () => {
        if (!isMobile) {
          cambiarAVistaDoble();
        }
      },

      // Pantalla completa
      enterFullScreen: () => {
        if (aplicandoZoom) return;
        
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

      // Info completa del estado con datos mÃ³viles
      getCurrentInfo: () => ({
        mode,
        scale: mode === "single" ? scaleSingle : scaleDual,
        currentPage: mode === "single" ? paginaActualSimple : leftPageDual,
        totalPages: docPages,
        pdfListo,
        aplicandoZoom,
        zoomLimits: ZOOM_CONFIG,
        leftPage: mode === "dual" ? leftPageDual : null,
        rightPage: mode === "dual" && leftPageDual + 1 <= docPages ? leftPageDual + 1 : null,
        
        // InformaciÃ³n mÃ³vil
        isMobile,
        isTouch,
        nativeGesturesEnabled,
        orientation,
        needsCompactUI,
        version: 'mobile-optimized-v1'
      })
    }));

    // ===================== LIMPIEZA MEJORADA =====================
    useEffect(() => {
      return () => {
        if (zoomTimeoutRef.current) {
          clearTimeout(zoomTimeoutRef.current);
        }
        if (notificacionPendienteRef.current) {
          clearTimeout(notificacionPendienteRef.current);
        }
      };
    }, []);

    // ===================== RENDER ADAPTADO =====================
    return (
      <div 
        className="visor-pdf" 
        ref={viewerRef}
        style={{ 
          position: "relative",
          // Ajustar altura para mÃ³vil
          height: isMobile && needsCompactUI ? '100vh' : undefined
        }}
      >
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
                onDocumentLoad={inicializarVisor}
                onPageChange={(e) => {
                  const curr = e.currentPage + 1;
                  handlePageChangeSafe(curr);
                }}
                defaultScale={
                  isMobile && ZOOM_CONFIG.MOBILE_FIT 
                    ? SpecialZoomLevel.PageFit 
                    : ZOOM_CONFIG.DEFAULT
                }
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
            </div>

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
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0, 0, 0, 0.8)",
                color: "white",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600",
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span>ðŸ“„</span>
              <span>
                {leftPageDual}-
                {leftPageDual + 1 <= docPages ? leftPageDual + 1 : "fin"}
              </span>
              <span>de {docPages}</span>
              <span style={{ marginLeft: "8px", opacity: 0.8, fontSize: "11px" }}>
                ðŸ” {Math.round(scaleDual * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Indicador de zoom en aplicaciÃ³n - MEJORADO PARA MÃ“VIL */}
        {aplicandoZoom && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(33, 150, 243, 0.95)",
              color: "white",
              padding: isMobile ? "12px 20px" : "16px 24px",
              borderRadius: "12px",
              fontSize: isMobile ? "14px" : "15px",
              fontWeight: "600",
              zIndex: 1500,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)"
            }}
          >
            <div style={{
              width: "18px",
              height: "18px",
              border: "3px solid white",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
            <span>
              {isMobile ? 'ðŸ“±' : 'ðŸ”'} Aplicando zoom {Math.round((mode === 'single' ? scaleSingle : scaleDual) * 100)}%
              {isMobile && nativeGesturesEnabled && <span style={{ opacity: 0.8 }}> (TÃ¡ctil)</span>}
            </span>
          </div>
        )}

        {/* Indicador de lÃ­mites de zoom - ADAPTADO PARA MÃ“VIL */}
        {((mode === 'single' && (scaleSingle >= ZOOM_CONFIG.MAX - 0.1 || scaleSingle <= ZOOM_CONFIG.MIN + 0.1)) ||
          (mode === 'dual' && (scaleDual >= ZOOM_CONFIG.MAX - 0.1 || scaleDual <= ZOOM_CONFIG.MIN + 0.1))) && !aplicandoZoom && (
          <div
            style={{
              position: "absolute",
              top: isMobile ? "10px" : "15px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255, 152, 0, 0.95)",
              color: "white",
              padding: isMobile ? "6px 12px" : "8px 16px",
              borderRadius: "8px",
              fontSize: isMobile ? "12px" : "13px",
              fontWeight: "600",
              zIndex: 200,
              boxShadow: "0 4px 12px rgba(255, 152, 0, 0.3)",
              backdropFilter: "blur(4px)"
            }}
          >
            ðŸ” Zoom: {Math.round((mode === 'single' ? scaleSingle : scaleDual) * 100)}% 
            <span style={{ opacity: 0.9 }}> (LÃ­mite alcanzado)</span>
            {isMobile && nativeGesturesEnabled && (
              <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>
                Usa gestos tÃ¡ctiles para continuar
              </div>
            )}
          </div>
        )}

        {/* Indicador de gestos mÃ³viles (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && isMobile && (
          <div
            style={{
              position: "absolute",
              bottom: needsCompactUI ? "10px" : "70px",
              right: "10px",
              background: "rgba(222, 0, 126, 0.9)",
              color: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "10px",
              fontFamily: "monospace",
              zIndex: 500,
              border: "1px solid rgba(255, 255, 255, 0.3)"
            }}
          >
            <div>ðŸ“± MÃ³vil: {orientation}</div>
            <div>ðŸ‘† TÃ¡ctil: {nativeGesturesEnabled ? 'ON' : 'OFF'}</div>
            <div>ðŸ” Escala: {(mode === 'single' ? scaleSingle : scaleDual).toFixed(2)}</div>
            <div>ðŸ“ UI: {needsCompactUI ? 'Compact' : 'Normal'}</div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
);

export default VisorPDF;
// Lector.jsx - VERSIÃ“N CON INTEGRACIÃ“N COMPLETA DE MEJORAS MÃ“VILES
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import PanelHerramientas from "./PanelHerramientas";
import BarraInferior from "./BarraInferior";
import VisorPDF from "./VisorPDF";
import TextosLayer from "./layers/TextosLayer";
import WelcomeModal from "./components/WelcomeModal";
import { useWelcomeModal } from "./hooks/useWelcomeModal";
import { useMobileDetection } from "./hooks/useMobileDetection";
import { useParams } from "react-router-dom";
import { getLibroById } from "../../servicios/libros";
import { textosAPI } from "../../servicios/textosAPI.js";
import { progresoAPI } from "../../servicios/progresoAPI";
import {
  iniciarSesionLectura,
  finalizarSesionLectura,
} from "../../servicios/sesionesLectura.js";
import "./lector.css";

function Lector() {
  const token = localStorage.getItem("access_token");
  const { libroId } = useParams();

  // ===================== DETECCIÃ“N MÃ“VIL =====================
  const { 
    isMobile, 
    isTouch, 
    shouldUseNativeGestures, 
    needsCompactUI,
    orientation,
    debugInfo 
  } = useMobileDetection();

  // ===================== VENTANA DE BIENVENIDA =====================
  const {
    showWelcomeModal,
    isInitialized: welcomeInitialized,
    closeWelcomeModal
  } = useWelcomeModal();

  // ===================== ESTADOS BÃSICOS ADAPTADOS =====================
  const [herramientaActiva, setHerramientaActiva] = useState("cursor");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);

  // Estado del libro
  const [libro, setLibro] = useState(null);
  const [libroLoading, setLibroLoading] = useState(true);
  const [libroError, setLibroError] = useState(null);
  const [paginaInicial, setPaginaInicial] = useState(1);

  // Estado de textos
  const [textos, setTextos] = useState([]);
  const [textosLoading, setTextosLoading] = useState(false);
  const [textosError, setTextosError] = useState(null);

  const sesionIdRef = useRef(null);

  // Estado del visor - ADAPTADO PARA MÃ“VIL
  const [visorInfo, setVisorInfo] = useState({
    mode: "single", // Vista doble deshabilitada en mÃ³vil
    scale: isMobile ? 1.0 : 1.2, // Escala inicial adaptada
    totalPages: 0,
    currentPage: 1,
    pdfListo: false,
    timestamp: Date.now(),
    // Nuevos campos mÃ³viles
    isMobile,
    isTouch,
    shouldUseNativeGestures,
    orientation
  });

  // Referencias
  const visorRef = useRef(null);
  const textosLayerRef = useRef(null);
  const yaCargoTextos = useRef(false);
  const containerRef = useRef(null); // Nueva ref para el contenedor

  // ===================== CONFIGURACIÃ“N MÃ“VIL ESPECÃFICA =====================
  
  // Configurar viewport para mÃ³vil
  useEffect(() => {
    if (isMobile) {
      console.log('ðŸ“± Configurando viewport para mÃ³vil:', {
        shouldUseNativeGestures,
        orientation,
        needsCompactUI
      });

      // Configurar viewport meta tag
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
      }

      // ConfiguraciÃ³n especÃ­fica para zoom tÃ¡ctil
      if (shouldUseNativeGestures) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes, viewport-fit=cover';
      } else {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      }

      // Configurar atributos especÃ­ficos del contenedor
      if (containerRef.current) {
        containerRef.current.dataset.mobile = 'true';
        containerRef.current.dataset.orientation = orientation;
        containerRef.current.dataset.nativeGestures = shouldUseNativeGestures.toString();
        containerRef.current.dataset.compactUi = needsCompactUI.toString();
      }

      return () => {
        // Limpiar configuraciones al cambiar a desktop
        if (viewport && !isMobile) {
          viewport.content = 'width=device-width, initial-scale=1.0';
        }
      };
    }
  }, [isMobile, shouldUseNativeGestures, orientation, needsCompactUI]);

  // Prevenir comportamientos predeterminados problemÃ¡ticos en mÃ³vil
  useEffect(() => {
    if (!isMobile) return;

    const preventDefaults = (e) => {
      // Prevenir zoom accidental en inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        e.target.style.fontSize = '16px'; // Prevenir zoom en iOS
      }
      
      // Prevenir pull-to-refresh
      if (e.touches && e.touches.length > 1) return;
      
      const startY = e.touches ? e.touches[0].clientY : e.clientY;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      
      if (scrollTop === 0 && startY > 0) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e) => {
      // Solo prevenir si no es un gesto de zoom
      if (e.touches.length === 1) {
        const scrollableParent = e.target.closest('.visor-pdf, .modal-texto-con-fuente');
        if (!scrollableParent) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchstart', preventDefaults, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventDefaults);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile]);

  // ===================== CARGA DEL LIBRO (SIN CAMBIOS) =====================

  useEffect(() => {
    let mounted = true;

    async function cargarLibro() {
      if (!libroId || !mounted) return;

      try {
        const { data: libroData } = await getLibroById(libroId);

        if (!mounted) return;

        let pagina = 1;
        if (token) {
          try {
            const progreso = await progresoAPI.getProgreso(libroId, token);
            if (progreso?.pro_pagina_actual > 0) {
              pagina = progreso.pro_pagina_actual;
            }
          } catch (progresoError) {
            // Sin progreso guardado
          }
        }

        if (!mounted) return;

        setLibro(libroData);
        setPaginaInicial(pagina);
        setPaginaActual(pagina);
        setLibroLoading(false);
      } catch (error) {
        if (mounted) {
          setLibroError(error.message);
          setLibroLoading(false);
        }
      }
    }

    cargarLibro();

    return () => {
      mounted = false;
    };
  }, [libroId, token]);

  // ===================== INICIAR LECTURA (SIN CAMBIOS) =====================

  useEffect(() => {
    iniciarSesionLectura(libroId).then((data) => {
      sesionIdRef.current = data.ls_id;
    });

    return () => {
      if (sesionIdRef.current) {
        finalizarSesionLectura(sesionIdRef.current);
      }
    };
  }, [libroId]);

  // ===================== CARGA DE TEXTOS (SIN CAMBIOS) =====================

  const cargarTextosUnaVez = useCallback(async () => {
    if (!libroId || !token || yaCargoTextos.current || textosLoading) {
      return;
    }

    yaCargoTextos.current = true;
    setTextosLoading(true);

    try {
      const textosFromAPI = await textosAPI.getTextos(libroId, token);

      const textosValidos = textosFromAPI
        .filter((t) => t?.txt_id && typeof t.txt_pagina === "number")
        .map((t) => ({
          id: t.txt_id,
          pagina: t.txt_pagina,
          x: t.txt_x,
          y: t.txt_y,
          texto: t.txt_texto,
          width: t.txt_ancho || 200,
          height: t.txt_alto || 60,
          fontSize: t.txt_dimension || 14,
        }));

      setTextos(textosValidos);
      setTextosLoading(false);
    } catch (error) {
      setTextosError(error.message);
      setTextosLoading(false);
    }
  }, [libroId, token, textosLoading]);

  useEffect(() => {
    if (libro && !libroLoading && !yaCargoTextos.current) {
      cargarTextosUnaVez();
    }
  }, [libro, libroLoading, cargarTextosUnaVez]);

  // ===================== FUNCIONES CRUD (SIN CAMBIOS) =====================

  const handleAddTexto = useCallback(
    async (datosTexto) => {
      if (!libroId || !token) throw new Error("Datos insuficientes");

      try {
        const textoCreado = await textosAPI.createTexto(
          {
            libroId: parseInt(libroId),
            ...datosTexto,
          },
          token
        );

        setTextos((prev) => [...prev, textoCreado]);
      } catch (error) {
        throw error;
      }
    },
    [libroId, token]
  );

  const handleEditTexto = useCallback(
    async (datosTexto) => {
      const { id, ...cambios } = datosTexto;
      if (!id || !libroId || !token) throw new Error("Datos insuficientes");

      try {
        const textoActualizado = await textosAPI.updateTexto(
          id,
          datosTexto,
          token
        );
        setTextos((prev) =>
          prev.map((t) => (t.id === id ? textoActualizado : t))
        );
      } catch (error) {
        throw error;
      }
    },
    [libroId, token]
  );

  const handleDeleteTexto = useCallback(
    async (id) => {
      if (!id || !libroId || !token) throw new Error("Datos insuficientes");

      try {
        await textosAPI.deleteTexto(id, token);
        setTextos((prev) => prev.filter((t) => t.id !== id));
      } catch (error) {
        throw error;
      }
    },
    [libroId, token]
  );

  // ===================== HANDLERS DEL VISOR ADAPTADOS =====================

  const handleDesactivarHerramienta = useCallback(() => {
    setHerramientaActiva("cursor");
  }, []);

  const handlePageChange = useCallback(
    async (page) => {
      if (page !== paginaActual && page > 0 && page <= totalPaginas) {
        setPaginaActual(page);

        if (libroId && token) {
          try {
            await progresoAPI.guardarProgreso(
              {
                libroId: parseInt(libroId),
                paginaActual: page,
                totalPaginas: totalPaginas,
              },
              token
            );
          } catch (error) {
            // Error guardando progreso
          }
        }
      }
    },
    [paginaActual, totalPaginas, libroId, token]
  );

  // ACTUALIZADO: NotificaciÃ³n de escala con informaciÃ³n mÃ³vil
  const handleScaleChange = useCallback((scale) => {
    console.log('ðŸ” Escala cambiada en Lector (mÃ³vil):', {
      scale,
      isMobile,
      shouldUseNativeGestures
    });
    
    setVisorInfo((prev) => ({ 
      ...prev, 
      scale,
      timestamp: Date.now(),
      // Actualizar info mÃ³vil
      isMobile,
      isTouch,
      shouldUseNativeGestures,
      orientation
    }));
  }, [isMobile, isTouch, shouldUseNativeGestures, orientation]);

  const handleModeChange = useCallback((mode) => {
    // Prevenir vista doble en mÃ³vil
    if (isMobile && mode === "dual") {
      console.log('ðŸ“± Vista doble deshabilitada en mÃ³vil');
      return;
    }
    
    setVisorInfo((prev) => ({ 
      ...prev, 
      mode,
      timestamp: Date.now()
    }));
  }, [isMobile]);

  const handleTotalPaginasChange = useCallback((total) => {
    setTotalPaginas(total);
    setVisorInfo((prev) => ({ 
      ...prev, 
      totalPages: total, 
      pdfListo: true,
      timestamp: Date.now()
    }));
  }, []);

  // ===================== INFORMACIÃ“N COMPUTADA ADAPTADA =====================

  const estadisticas = useMemo(
    () => ({
      totalTextos: textos.length,
      textosEnPaginaActual: textos.filter((t) => t.pagina === paginaActual)
        .length,
      // Nuevas estadÃ­sticas mÃ³viles
      dispositivoInfo: {
        isMobile,
        isTouch,
        shouldUseNativeGestures,
        orientation,
        needsCompactUI
      }
    }),
    [textos, paginaActual, isMobile, isTouch, shouldUseNativeGestures, orientation, needsCompactUI]
  );

  // ===================== GESTIÃ“N DE ORIENTACIÃ“N MÃ“VIL =====================
  useEffect(() => {
    if (!isMobile) return;

    const handleOrientationChange = () => {
      // PequeÃ±o delay para que se complete el cambio de orientaciÃ³n
      setTimeout(() => {
        // Forzar re-render del visor
        setVisorInfo(prev => ({
          ...prev,
          orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
          timestamp: Date.now()
        }));
      }, 300);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isMobile]);

  // ===================== RENDER CONDICIONAL MEJORADO =====================

  if (libroLoading) {
    return (
      <div className="lector-container" ref={containerRef}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(33, 150, 243, 0.9)",
            color: "white",
            padding: isMobile ? "16px 24px" : "20px 30px",
            borderRadius: "12px",
            fontSize: isMobile ? "14px" : "16px",
            fontWeight: "bold",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 10000,
            textAlign: "center",
            maxWidth: isMobile ? "280px" : "400px"
          }}
        >
          <div>
            {isMobile && shouldUseNativeGestures && "ðŸ“± "}
            Cargando libro...
          </div>
          {isMobile && (
            <div style={{ fontSize: "12px", marginTop: "8px", opacity: 0.8 }}>
              {shouldUseNativeGestures ? "Zoom tÃ¡ctil habilitado" : "Controles tÃ¡ctiles"}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (libroError) {
    return (
      <div className="lector-container" ref={containerRef}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(244, 67, 54, 0.9)",
            color: "white",
            padding: isMobile ? "16px 24px" : "20px 30px",
            borderRadius: "12px",
            fontSize: isMobile ? "14px" : "16px",
            fontWeight: "bold",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 10000,
            textAlign: "center",
            maxWidth: isMobile ? "300px" : "400px",
          }}
        >
          <div>Error cargando el libro</div>
          <div style={{ fontSize: isMobile ? "12px" : "14px", marginTop: "8px", opacity: 0.8 }}>
            {libroError}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "12px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "white",
              padding: isMobile ? "6px 12px" : "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: isMobile ? "12px" : "14px",
              touchAction: "manipulation"
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!libro) {
    return (
      <div className="lector-container" ref={containerRef}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(255, 152, 0, 0.9)",
            color: "white",
            padding: isMobile ? "16px 24px" : "20px 30px",
            borderRadius: "12px",
            fontSize: isMobile ? "14px" : "16px",
            fontWeight: "bold",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 10000,
            textAlign: "center",
          }}
        >
          <div>Libro no encontrado</div>
        </div>
      </div>
    );
  }

  // ===================== RENDER PRINCIPAL ADAPTADO =====================

  return (
    <div 
      className="lector-container" 
      ref={containerRef}
      data-mobile={isMobile}
      data-orientation={orientation}
      data-native-gestures={shouldUseNativeGestures}
      data-compact-ui={needsCompactUI}
      style={{
        // Ajustes dinÃ¡micos segÃºn dispositivo
        height: isMobile && needsCompactUI ? '100vh' : '100vh',
        touchAction: shouldUseNativeGestures ? 'manipulation' : 'none'
      }}
    >
      {/* Panel de herramientas - Adaptado para mÃ³vil */}
      <PanelHerramientas
        herramientaActiva={herramientaActiva}
        setHerramientaActiva={setHerramientaActiva}
        visorRef={visorRef}
        isMobile={isMobile}
        needsCompactUI={needsCompactUI}
      />

      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Capa de textos - Con informaciÃ³n mÃ³vil integrada */}
        <TextosLayer
          ref={textosLayerRef}
          herramientaActiva={herramientaActiva}
          paginaActual={paginaActual}
          visorInfo={visorInfo}
          textos={textos}
          onAddTexto={handleAddTexto}
          onEditTexto={handleEditTexto}
          onDeleteTexto={handleDeleteTexto}
          onDesactivarHerramienta={handleDesactivarHerramienta}
          isMobile={isMobile}
          isTouch={isTouch}
        />

        {/* Visor PDF - Con mejoras mÃ³viles completas */}
        <VisorPDF
          ref={visorRef}
          fileUrl={libro?.url || ""}
          herramientaActiva={herramientaActiva}
          onPageChange={handlePageChange}
          paginaInicial={paginaInicial}
          setTotalPaginas={handleTotalPaginasChange}
          onDesactivarHerramienta={handleDesactivarHerramienta}
          onScaleChange={handleScaleChange}
          onModeChange={handleModeChange}
          isMobile={isMobile}
          isTouch={isTouch}
          shouldUseNativeGestures={shouldUseNativeGestures}
        />
      </div>

      {/* Barra inferior - Con comportamiento adaptativo */}
      <BarraInferior
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        visorRef={visorRef}
        isMobile={isMobile}
        shouldUseNativeGestures={shouldUseNativeGestures}
        needsCompactUI={needsCompactUI}
      />

      {/* Indicadores de estado adaptativos */}
      {textosLoading && (
        <div
          style={{
            position: "fixed",
            bottom: isMobile ? "80px" : "120px",
            right: "20px",
            background: "rgba(33, 150, 243, 0.9)",
            color: "white",
            padding: isMobile ? "6px 10px" : "8px 12px",
            borderRadius: "6px",
            fontSize: isMobile ? "12px" : "13px",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              border: "2px solid white",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          Cargando textos...
        </div>
      )}

      {textosError && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#f44336",
            color: "white",
            padding: isMobile ? "10px 14px" : "12px 16px",
            borderRadius: "6px",
            fontSize: isMobile ? "13px" : "14px",
            zIndex: 10001,
            maxWidth: isMobile ? "250px" : "300px",
          }}
        >
          Error cargando textos: {textosError}
          <button
            onClick={() => {
              setTextosError(null);
              yaCargoTextos.current = false;
              cargarTextosUnaVez();
            }}
            style={{
              marginLeft: "12px",
              background: "none",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: isMobile ? "11px" : "12px",
              touchAction: "manipulation"
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Indicador de informaciÃ³n mÃ³vil (solo desarrollo) */}
      {process.env.NODE_ENV === 'development' && isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: needsCompactUI ? "10px" : "100px",
            left: "10px",
            background: "rgba(222, 0, 126, 0.9)",
            color: "white",
            padding: "8px 10px",
            borderRadius: "6px",
            fontSize: "10px",
            fontFamily: "monospace",
            zIndex: 1500,
            border: "1px solid rgba(255, 255, 255, 0.3)",
            maxWidth: "200px"
          }}
        >
          <div>Dispositivo: {orientation}</div>
          <div>Gestos: {shouldUseNativeGestures ? 'Nativos' : 'Controles'}</div>
          <div>UI: {needsCompactUI ? 'Compacta' : 'Normal'}</div>
          <div>Textos: {textos.length}</div>
          <div>Escala: {visorInfo.scale?.toFixed(2) || '1.00'}</div>
          <div style={{ fontSize: "8px", opacity: 0.8, marginTop: "2px" }}>
            {debugInfo.windowSize}
          </div>
        </div>
      )}

      {/* Instrucciones iniciales para mÃ³vil */}
      {isMobile && shouldUseNativeGestures && !textosLoading && !textosError && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            zIndex: 300,
            textAlign: "center",
            opacity: herramientaActiva === "cursor" ? 1 : 0.7,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
            maxWidth: "280px"
          }}
        >
          {herramientaActiva === "texto" 
            ? "Toca en el PDF para crear texto"
            : "Pellizca para zoom â€¢ Desliza para navegar"
          }
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* ===================== VENTANA DE BIENVENIDA ===================== */}
      {welcomeInitialized && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={closeWelcomeModal}
          isMobile={isMobile}
          shouldUseNativeGestures={shouldUseNativeGestures}
        />
      )}
    </div>
  );
}

export default Lector;
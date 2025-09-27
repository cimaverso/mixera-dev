// src/Componentes/Lector/VisorPDF.jsx - VERSIÓN CORREGIDA CON COORDENADAS UNIFICADAS
import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configuración del worker que coincide con la API version 2.12.313
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Componente que renderiza el PDF con sistema de coordenadas unificado
 * CORREGIDO: Coordenadas consistentes entre móvil y desktop
 */
const VisorPDF = forwardRef(({
  pdfUrl,
  paginaActual,
  zoom,
  modoVista,
  onPaginaCambiada,
  onTotalPaginas,
  onDimensionesCambiadas,
}, ref) => {
  
  const [numPages, setNumPages] = useState(null);
  const [cargandoPagina, setCargandoPagina] = useState(false);
  const [errorPDF, setErrorPDF] = useState(null);
  const [dimensiones, setDimensiones] = useState({ width: 0, height: 0 });
  const [dimensionesViewport, setDimensionesViewport] = useState({ width: 0, height: 0 });
  const [esDispositiveMovil, setEsDispositiveMovil] = useState(false);
  const [orientacion, setOrientacion] = useState('portrait');

  // NUEVO: Referencia para evitar re-creación de objetos
  const ultimaDeteccionRef = useRef({ width: 0, height: 0, esMobile: false });

  /**
   * Detectar dispositivo móvil y dimensiones del viewport (memoizado)
   */
  const detectarDispositivo = useCallback(() => {
    const esMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    ('ontouchstart' in window) ||
                    (window.innerWidth <= 768);
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const nuevaOrientacion = width > height ? 'landscape' : 'portrait';
    
    // Solo actualizar estado si hay cambios reales
    const ultimaDeteccion = ultimaDeteccionRef.current;
    if (ultimaDeteccion.width !== width || 
        ultimaDeteccion.height !== height || 
        ultimaDeteccion.esMobile !== esMobile) {
      
      ultimaDeteccionRef.current = { width, height, esMobile };
      
      setEsDispositiveMovil(esMobile);
      setDimensionesViewport({ width, height });
      setOrientacion(nuevaOrientacion);
    }
    
    return { esMobile, width, height };
  }, []);

  /**
   * NUEVO: Calcula dimensiones base normalizadas para coordenadas consistentes
   * Esta función asegura que las coordenadas sean compatibles entre móvil y desktop
   */
  const calcularDimensionesBase = useCallback(() => {
    // Usar dimensiones reales del PDF si están disponibles
    if (dimensiones.width > 0 && dimensiones.height > 0) {
      return {
        ancho: dimensiones.width,
        alto: dimensiones.height
      };
    }
    
    // Fallback a dimensiones estándar A4 en puntos PDF
    return {
      ancho: 595,  // A4 width en puntos PDF
      alto: 842    // A4 height en puntos PDF
    };
  }, [dimensiones]);

  /**
   * Calcular ancho óptimo para renderizado (memoizado con dependencias específicas)
   */
  const anchoOptimo = useMemo(() => {
    const { width, height } = dimensionesViewport;
    
    if (!esDispositiveMovil) {
      // Desktop: usar ancho base con zoom
      return 600 * zoom;
    }
    
    // Móvil: calcular ancho que quepa en la pantalla
    let anchoMaximo;
    
    if (orientacion === 'landscape') {
      // Horizontal: usar 90% del ancho disponible
      anchoMaximo = width * 0.9;
    } else {
      // Vertical: usar 95% del ancho disponible
      anchoMaximo = width * 0.95;
    }
    
    // Aplicar padding para los controles y márgenes
    const padding = esDispositiveMovil ? 40 : 80;
    anchoMaximo = Math.max(300, anchoMaximo - padding);
    
    // Aplicar zoom pero limitando el resultado
    const anchoConZoom = anchoMaximo * zoom;
    
    // En móvil, limitar el zoom máximo para evitar que se corte
    const zoomMaximoMovil = esDispositiveMovil ? 2.5 : 4;
    const zoomLimitado = Math.min(zoom, zoomMaximoMovil);
    
    return Math.min(anchoConZoom, anchoMaximo * zoomLimitado);
  }, [zoom, orientacion, dimensionesViewport, esDispositiveMovil]);

  /**
   * Manejar cambios de orientación y resize (con debounce)
   */
  useEffect(() => {
    let timeoutId = null;
    
    const manejarResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        detectarDispositivo();
      }, 100);
    };
    
    const manejarOrientacion = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        detectarDispositivo();
      }, 200);
    };
    
    // Event listeners
    window.addEventListener('resize', manejarResize);
    window.addEventListener('orientationchange', manejarOrientacion);
    
    // Detección inicial solo una vez
    detectarDispositivo();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', manejarResize);
      window.removeEventListener('orientationchange', manejarOrientacion);
    };
  }, [detectarDispositivo]);

  /**
   * Callback cuando el documento PDF se carga exitosamente
   */
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setErrorPDF(null);
    onTotalPaginas?.(numPages);
    console.log('PDF cargado exitosamente:', numPages, 'páginas');
  }, [onTotalPaginas]);

  /**
   * CORREGIDO: Callback cuando una página se renderiza exitosamente
   * NUEVO: Usa dimensiones base normalizadas para coordenadas consistentes
   */
  const onPageLoadSuccess = useCallback((page) => {
    const { width, height } = page;
    
    // Solo actualizar si las dimensiones realmente cambiaron
    setDimensiones(prevDimensiones => {
      if (prevDimensiones.width !== width || prevDimensiones.height !== height) {
        // NUEVO: Usar dimensiones base normalizadas para coordenadas
        const dimensionesBase = {
          ancho: width,  // Dimensiones reales del PDF en puntos
          alto: height
        };
        
        // Llamar callback con dimensiones base para coordenadas consistentes
        setTimeout(() => {
          onDimensionesCambiadas?.(dimensionesBase);
        }, 0);
        
        console.log('Página cargada - Dimensiones base:', dimensionesBase);
        return { width, height };
      }
      return prevDimensiones;
    });
    
    setCargandoPagina(false);
  }, [onDimensionesCambiadas]);

  /**
   * Callback para errores de carga del documento
   */
  const onDocumentLoadError = useCallback((error) => {
    console.error('Error cargando PDF:', error);
    setErrorPDF('Error al cargar el documento PDF. Verifica que el archivo existe y tienes permisos.');
  }, []);

  /**
   * Obtener estilos del contenedor (memoizado)
   */
  const estilosContenedor = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: esDispositiveMovil ? '100%' : `${anchoOptimo + 40}px`,
    margin: '0 auto',
    overflowX: esDispositiveMovil ? 'hidden' : 'visible',
    padding: esDispositiveMovil ? '10px' : '20px'
  }), [anchoOptimo, esDispositiveMovil]);

  /**
   * Obtener estilos de la página (memoizado)
   */
  const estilosPagina = useMemo(() => ({
    maxWidth: '100%',
    height: 'auto',
    margin: '0 auto',
    boxShadow: esDispositiveMovil 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
      : '0 4px 12px rgba(0, 0, 0, 0.15)',
    borderRadius: esDispositiveMovil ? '4px' : '8px',
    display: 'block'
  }), [esDispositiveMovil]);

  /**
   * CORREGIDO: Métodos expuestos al componente padre via ref
   */
  useImperativeHandle(ref, () => ({
    nextPage: () => {
      if (paginaActual < numPages) {
        onPaginaCambiada?.(paginaActual + 1);
      }
    },
    
    prevPage: () => {
      if (paginaActual > 1) {
        onPaginaCambiada?.(paginaActual - 1);
      }
    },
    
    goToPage: (pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= numPages) {
        onPaginaCambiada?.(pageNumber);
      }
    },
    
    enterFullScreen: () => {
      const elemento = document.querySelector('.visor-pdf');
      if (elemento?.requestFullscreen) {
        elemento.requestFullscreen();
      }
    },
    
    getCurrentPageInfo: () => ({
      paginaActual,
      totalPaginas: numPages,
      zoom,
      dimensiones,
      modoVista,
      esDispositiveMovil,
      orientacion,
      dimensionesViewport
    }),
    
    getPDFDimensions: () => dimensiones,
    
    // NUEVO: Obtener dimensiones base para coordenadas
    getDimensionesBase: () => calcularDimensionesBase(),
    
    recalcularDimensiones: () => {
      detectarDispositivo();
    }
    
  }), [
    paginaActual, numPages, zoom, dimensiones, modoVista, 
    onPaginaCambiada, esDispositiveMovil, orientacion, 
    dimensionesViewport, detectarDispositivo, calcularDimensionesBase
  ]);

  // Manejo de atajos de teclado
  useEffect(() => {
    const manejarTeclas = (event) => {
      // Solo si no está editando texto
      if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          if (paginaActual > 1) {
            onPaginaCambiada?.(paginaActual - 1);
          }
          break;
          
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          if (paginaActual < numPages) {
            onPaginaCambiada?.(paginaActual + 1);
          }
          break;
          
        default:
          break;
      }
    };

    window.addEventListener('keydown', manejarTeclas);
    return () => window.removeEventListener('keydown', manejarTeclas);
  }, [paginaActual, numPages, onPaginaCambiada]);

  return (
    <div 
      className="visor-pdf"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflowX: esDispositiveMovil ? 'hidden' : 'auto'
      }}
    >
      {errorPDF ? (
        <div className="error-pdf">
          <div className="error-contenido">
            <h3>Error al cargar PDF</h3>
            <p>{errorPDF}</p>
            <button onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="cargando-documento">
              <div className="spinner-pdf"></div>
              <p>Cargando documento PDF...</p>
              {esDispositiveMovil && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  Ajustando tamaño para tu dispositivo...
                </p>
              )}
            </div>
          }
        >
          {numPages && (
            <div className="contenedor-paginas" style={estilosContenedor}>
              <Page
                pageNumber={paginaActual}
                width={anchoOptimo}
                onLoadSuccess={onPageLoadSuccess}
                loading={
                  <div className="cargando-pagina">
                    <div className="spinner-pagina"></div>
                    <p>Cargando página...</p>
                  </div>
                }
                renderTextLayer={false}
                renderAnnotationLayer={false}
                style={estilosPagina}
              />
              
              {/* Información de debug solo en desarrollo */}
              {process.env.NODE_ENV === 'development' && esDispositiveMovil && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  zIndex: 1000
                }}>
                  <div>Móvil: {esDispositiveMovil ? 'Sí' : 'No'}</div>
                  <div>Orientación: {orientacion}</div>
                  <div>Viewport: {dimensionesViewport.width}x{dimensionesViewport.height}</div>
                  <div>Ancho PDF: {Math.round(anchoOptimo)}px</div>
                  <div>Zoom: {Math.round(zoom * 100)}%</div>
                  <div>Base: {dimensiones.width}x{dimensiones.height}</div>
                </div>
              )}
            </div>
          )}
        </Document>
      )}
    </div>
  );
});

VisorPDF.displayName = 'VisorPDF';

export default VisorPDF;
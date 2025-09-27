// src/Componentes/Lector/VisorPDF.jsx - VERSIÃ“N ESTABLE
import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// ConfiguraciÃ³n del worker que coincide con la API version 2.12.313
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Componente que renderiza el PDF usando react-pdf
 * VersiÃ³n estable optimizada para evitar problemas de worker
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

  /**
   * Callback cuando el documento PDF se carga exitosamente
   */
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setErrorPDF(null);
    onTotalPaginas?.(numPages);
    console.log('PDF cargado exitosamente:', numPages, 'pÃ¡ginas');
  }, [onTotalPaginas]);

  /**
   * Callback cuando una pÃ¡gina se renderiza exitosamente
   */
  const onPageLoadSuccess = useCallback((page) => {
    const { width, height } = page;
    setDimensiones({ width, height });
    onDimensionesCambiadas?.({ ancho: width, alto: height });
    setCargandoPagina(false);
    console.log('PÃ¡gina cargada - Dimensiones:', { width, height });
  }, [onDimensionesCambiadas]);

  /**
   * Callback para errores de carga del documento
   */
  const onDocumentLoadError = useCallback((error) => {
    console.error('Error cargando PDF:', error);
    setErrorPDF('Error al cargar el documento PDF. Verifica que el archivo existe y tienes permisos.');
  }, []);

  /**
   * Calcular el ancho de la pÃ¡gina segÃºn el zoom
   */
  const calcularAnchoPagina = useCallback(() => {
    const anchoBase = 600;
    return anchoBase * zoom;
  }, [zoom]);

  /**
   * MÃ©todos expuestos al componente padre via ref
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
      modoVista
    }),
    
    getPDFDimensions: () => dimensiones
    
  }), [paginaActual, numPages, zoom, dimensiones, modoVista, onPaginaCambiada]);

  // Manejo de atajos de teclado
  useEffect(() => {
    const manejarTeclas = (event) => {
      // Solo si no estÃ¡ editando texto
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

  const anchoPagina = calcularAnchoPagina();

  return (
    <div className="visor-pdf">
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
            </div>
          }
        >
          {numPages && (
            <div className="contenedor-paginas">
              <Page
                pageNumber={paginaActual}
                width={anchoPagina}
                onLoadSuccess={onPageLoadSuccess}
                loading={<div className="cargando-pagina">Cargando pÃ¡gina...</div>}
              />
            </div>
          )}
        </Document>
      )}
    </div>
  );
});

VisorPDF.displayName = 'VisorPDF';

export default VisorPDF;
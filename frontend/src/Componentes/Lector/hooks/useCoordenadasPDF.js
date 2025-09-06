// useCoordenadasPDF.js - CORREGIDO para evitar re-renders excesivos
import { useState, useCallback, useEffect, useRef } from 'react';

export function useCoordenadasPDF(visorInfo, isActive = true) {
  const [currentPDFScale, setCurrentPDFScale] = useState(1.0);
  const lastScaleRef = useRef(1.0);
  const scaleCheckTimeoutRef = useRef(null);
  const observersRef = useRef({ mutation: null, resize: null });

  // CORREGIDO: Debounce más agresivo para evitar updates excesivos
  const updateScale = useCallback((newScale) => {
    const roundedScale = Math.round(newScale * 100) / 100; // Redondear a 2 decimales
    
    if (Math.abs(roundedScale - lastScaleRef.current) > 0.1) { // Threshold más alto
      console.log(`Escala del PDF actualizada: ${lastScaleRef.current.toFixed(2)} → ${roundedScale.toFixed(2)}`);
      setCurrentPDFScale(roundedScale);
      lastScaleRef.current = roundedScale;
      return true;
    }
    return false;
  }, []);

  // Detectar información real del PDF con escala - OPTIMIZADO
  const getPDFInfo = useCallback(() => {
    try {
      const page = document.querySelector('.rpv-core__inner-page');
      const canvas = document.querySelector('.rpv-core__canvas-layer canvas');
      
      if (!page || !canvas) {
        return { 
          pageWidth: 800, 
          pageHeight: 600, 
          scale: visorInfo?.scale || 1,
          found: false 
        };
      }
      
      const pageRect = page.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      
      // Verificar que tenemos dimensiones válidas
      if (canvasRect.width === 0 || canvas.width === 0) {
        return {
          pageWidth: pageRect.width || 800,
          pageHeight: pageRect.height || 600,
          scale: lastScaleRef.current,
          found: false
        };
      }
      
      // El scale real es la diferencia entre el tamaño mostrado y el tamaño del canvas
      const actualScale = canvasRect.width / canvas.width;
      
      return {
        pageWidth: pageRect.width,
        pageHeight: pageRect.height,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        scale: actualScale,
        found: true
      };
    } catch (error) {
      console.warn('Error obteniendo info del PDF:', error);
      return { 
        pageWidth: 800, 
        pageHeight: 600, 
        scale: lastScaleRef.current,
        found: false 
      };
    }
  }, [visorInfo?.scale]);

  // Convertir coordenadas de click a relativas (0-1)
  const convertToRelative = useCallback((event, overlayElement) => {
    if (!overlayElement) return null;
    
    try {
      const rect = overlayElement.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      
      return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y))
      };
    } catch (error) {
      console.warn('Error convirtiendo coordenadas:', error);
      return null;
    }
  }, []);

  // Convertir coordenadas relativas a píxeles escalados
  const convertToScaled = useCallback((relativeCoords, baseWidth, baseHeight) => {
    return {
      width: Math.round(baseWidth * currentPDFScale),
      height: Math.round(baseHeight * currentPDFScale)
    };
  }, [currentPDFScale]);

  // Escalar fontSize según el zoom actual
  const scaleFont = useCallback((baseFontSize) => {
    return Math.max(10, Math.round(baseFontSize * currentPDFScale));
  }, [currentPDFScale]);

  // Escalar padding y otros valores de estilo
  const scaleValue = useCallback((baseValue) => {
    return Math.max(1, Math.round(baseValue * currentPDFScale));
  }, [currentPDFScale]);

  // CORREGIDO: Función de verificación de escala con debounce
  const checkScaleChange = useCallback(() => {
    // Limpiar timeout anterior
    if (scaleCheckTimeoutRef.current) {
      clearTimeout(scaleCheckTimeoutRef.current);
    }
    
    scaleCheckTimeoutRef.current = setTimeout(() => {
      const pdfInfo = getPDFInfo();
      
      if (pdfInfo.found) {
        updateScale(pdfInfo.scale);
      }
    }, 150); // Debounce de 150ms
  }, [getPDFInfo, updateScale]);

  // CORREGIDO: Observer para cambios de zoom - más eficiente
  useEffect(() => {
    if (!isActive || visorInfo?.mode !== 'single') {
      return;
    }

    // Limpiar observers anteriores
    if (observersRef.current.mutation) {
      observersRef.current.mutation.disconnect();
    }
    if (observersRef.current.resize) {
      observersRef.current.resize.disconnect();
    }

    let isSetup = false;
    
    const setupObservers = () => {
      if (isSetup) return;
      
      try {
        // Buscar elementos una sola vez
        const targetElements = [
          document.querySelector('.rpv-core__viewer'),
          document.querySelector('.rpv-core__inner-page'),
          document.querySelector('.rpv-core__canvas-layer canvas')
        ].filter(Boolean);
        
        if (targetElements.length === 0) {
          // Reintentar setup después de un delay
          setTimeout(setupObservers, 500);
          return;
        }

        // MutationObserver - solo para cambios de estilo críticos
        observersRef.current.mutation = new MutationObserver((mutations) => {
          let shouldCheck = false;
          
          for (const mutation of mutations) {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'style' &&
                mutation.target.style.transform) {
              shouldCheck = true;
              break;
            }
          }
          
          if (shouldCheck) {
            checkScaleChange();
          }
        });
        
        // Observar solo el viewer principal
        const viewer = targetElements[0];
        if (viewer) {
          observersRef.current.mutation.observe(viewer, {
            attributes: true,
            attributeFilter: ['style'],
            subtree: false
          });
        }

        // ResizeObserver - solo para el canvas
        const canvas = targetElements[2];
        if (canvas && window.ResizeObserver) {
          observersRef.current.resize = new ResizeObserver((entries) => {
            if (entries.length > 0) {
              checkScaleChange();
            }
          });
          
          observersRef.current.resize.observe(canvas);
        }
        
        isSetup = true;
        console.log('Observers configurados para detección de escala');
        
        // Verificación inicial
        setTimeout(() => {
          checkScaleChange();
        }, 200);
        
      } catch (error) {
        console.warn('Error configurando observers:', error);
        setTimeout(setupObservers, 1000);
      }
    };

    setupObservers();

    // Cleanup
    return () => {
      if (scaleCheckTimeoutRef.current) {
        clearTimeout(scaleCheckTimeoutRef.current);
      }
      
      if (observersRef.current.mutation) {
        observersRef.current.mutation.disconnect();
      }
      if (observersRef.current.resize) {
        observersRef.current.resize.disconnect();
      }
      
      isSetup = false;
    };
  }, [isActive, visorInfo?.mode, checkScaleChange]);

  // CORREGIDO: Efecto inicial más simple
  useEffect(() => {
    if (isActive && visorInfo?.mode === 'single') {
      // Solo una verificación inicial después de montaje
      const timer = setTimeout(() => {
        const pdfInfo = getPDFInfo();
        if (pdfInfo.found) {
          updateScale(pdfInfo.scale);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, visorInfo?.mode, getPDFInfo, updateScale]);

  return {
    currentPDFScale,
    getPDFInfo,
    convertToRelative,
    convertToScaled,
    scaleFont,
    scaleValue
  };
}
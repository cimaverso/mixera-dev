// useCoordenadasPDF.js - HOOK ROBUSTO CORREGIDO
import { useState, useCallback, useEffect, useRef } from 'react';

export function useCoordenadasPDF(visorInfo = {}, isActive = true) {
  // ===================== ESTADO CENTRALIZADO =====================
  const [escalaEstable, setEscalaEstable] = useState(1.0);
  
  // Referencias para control interno
  const escalaAnterior = useRef(1.0);
  const timeoutDebounce = useRef(null);
  const observersRef = useRef({
    mutation: null,
    resize: null
  });
  const ultimaDeteccion = useRef(0);
  const cacheInfoPDF = useRef({
    escala: 1.0,
    timestamp: 0,
    valida: false
  });

  // ===================== CONFIGURACIÓN =====================
  const CONFIG = {
    DEBOUNCE_TIME: 200,
    CACHE_DURATION: 500,
    MIN_SCALE: 0.1,
    MAX_SCALE: 5.0,
    THRESHOLD_CAMBIO: 0.05
  };

  // ===================== VALIDACIÓN DE ESCALA =====================
  const validarEscala = useCallback((escala) => {
    if (!escala || typeof escala !== 'number' || isNaN(escala)) {
      return 1.0;
    }
    return Math.max(CONFIG.MIN_SCALE, Math.min(CONFIG.MAX_SCALE, escala));
  }, [CONFIG]);

  // ===================== DETECCIÓN ROBUSTA DE ESCALA =====================
  const detectarEscalaReal = useCallback(() => {
    const ahora = Date.now();
    
    // Usar cache si es reciente
    if (cacheInfoPDF.current.valida && 
        (ahora - cacheInfoPDF.current.timestamp) < CONFIG.CACHE_DURATION) {
      return cacheInfoPDF.current.escala;
    }

    try {
      // Estrategia 1: Desde visorInfo (más confiable)
      if (visorInfo?.scale && typeof visorInfo.scale === 'number') {
        const escalaValidada = validarEscala(visorInfo.scale);
        
        cacheInfoPDF.current = {
          escala: escalaValidada,
          timestamp: ahora,
          valida: true
        };
        
        return escalaValidada;
      }

      // Estrategia 2: Calcular desde DOM
      const pagina = document.querySelector('.rpv-core__inner-page');
      const canvas = document.querySelector('.rpv-core__canvas-layer canvas');
      
      if (pagina && canvas) {
        const paginaRect = pagina.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        if (canvas.width > 0 && canvasRect.width > 0) {
          const escalaCalculada = canvasRect.width / canvas.width;
          const escalaValidada = validarEscala(escalaCalculada);
          
          cacheInfoPDF.current = {
            escala: escalaValidada,
            timestamp: ahora,
            valida: true
          };
          
          console.log('📏 Escala calculada desde DOM:', {
            canvasWidth: canvas.width,
            canvasDisplayWidth: canvasRect.width,
            escalaCalculada: escalaCalculada.toFixed(3),
            escalaValidada: escalaValidada.toFixed(3)
          });
          
          return escalaValidada;
        }
      }

      // Fallback: usar escala anterior o 1.0
      const escalaFallback = escalaAnterior.current || 1.0;
      
      cacheInfoPDF.current = {
        escala: escalaFallback,
        timestamp: ahora,
        valida: false // Marcar como no confiable
      };
      
      return escalaFallback;
      
    } catch (error) {
      console.warn('⚠️ Error detectando escala, usando fallback:', error);
      return escalaAnterior.current || 1.0;
    }
  }, [visorInfo, validarEscala, CONFIG]);

  // ===================== ACTUALIZACIÓN DE ESCALA CON DEBOUNCING =====================
  const actualizarEscala = useCallback(() => {
    if (!isActive) return;
    
    if (timeoutDebounce.current) {
      clearTimeout(timeoutDebounce.current);
    }
    
    timeoutDebounce.current = setTimeout(() => {
      const nuevaEscala = detectarEscalaReal();
      
      // Solo actualizar si hay un cambio significativo
      if (Math.abs(nuevaEscala - escalaAnterior.current) > CONFIG.THRESHOLD_CAMBIO) {
        const escalaPreviaLog = escalaAnterior.current.toFixed(3);
        const escalaNuevaLog = nuevaEscala.toFixed(3);
        
        console.log(`📐 Escala actualizada: ${escalaPreviaLog} → ${escalaNuevaLog}`);
        
        setEscalaEstable(nuevaEscala);
        escalaAnterior.current = nuevaEscala;
        ultimaDeteccion.current = Date.now();
      }
    }, CONFIG.DEBOUNCE_TIME);
  }, [isActive, detectarEscalaReal, CONFIG]);

  // ===================== FUNCIONES DE COORDENADAS =====================
  
  // Convertir coordenadas de evento a relativas (0-1)
  const convertirARelativas = useCallback((evento, elemento) => {
    if (!evento || !elemento) {
      console.warn('⚠️ Evento o elemento no válido para conversión de coordenadas');
      return null;
    }
    
    try {
      const rect = elemento.getBoundingClientRect();
      
      if (rect.width === 0 || rect.height === 0) {
        console.warn('⚠️ Elemento con dimensiones cero');
        return null;
      }
      
      const x = (evento.clientX - rect.left) / rect.width;
      const y = (evento.clientY - rect.top) / rect.height;
      
      // Validar que las coordenadas están en rango válido
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        console.warn('⚠️ Coordenadas fuera del rango válido:', { x, y });
        return null;
      }
      
      return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y))
      };
    } catch (error) {
      console.error('❌ Error convirtiendo coordenadas:', error);
      return null;
    }
  }, []);

  // Convertir coordenadas relativas a píxeles escalados
  const convertirAEscaladas = useCallback((coordenadasRelativas, baseWidth, baseHeight) => {
    if (!coordenadasRelativas || typeof baseWidth !== 'number' || typeof baseHeight !== 'number') {
      console.warn('⚠️ Parámetros no válidos para conversión escalada');
      return { width: 200, height: 60 };
    }
    
    const escalaActual = escalaEstable;
    
    return {
      width: Math.round(baseWidth * escalaActual),
      height: Math.round(baseHeight * escalaActual),
      x: coordenadasRelativas.x,
      y: coordenadasRelativas.y,
      escala: escalaActual
    };
  }, [escalaEstable]);

  // Escalar valor individual
  const escalarValor = useCallback((valorBase) => {
    if (typeof valorBase !== 'number' || isNaN(valorBase)) {
      return 1;
    }
    return Math.max(1, Math.round(valorBase * escalaEstable));
  }, [escalaEstable]);

  // Obtener información completa del PDF
  const obtenerInfoPDF = useCallback(() => {
    try {
      const pagina = document.querySelector('.rpv-core__inner-page');
      const canvas = document.querySelector('.rpv-core__canvas-layer canvas');
      
      if (!pagina || !canvas) {
        return {
          encontrado: false,
          escala: escalaEstable,
          paginaWidth: 800,
          paginaHeight: 600,
          canvasWidth: 800,
          canvasHeight: 600
        };
      }
      
      const paginaRect = pagina.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      
      return {
        encontrado: true,
        escala: escalaEstable,
        paginaWidth: paginaRect.width,
        paginaHeight: paginaRect.height,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        canvasDisplayWidth: canvasRect.width,
        canvasDisplayHeight: canvasRect.height,
        elemento: {
          pagina,
          canvas
        }
      };
    } catch (error) {
      console.warn('⚠️ Error obteniendo info del PDF:', error);
      return {
        encontrado: false,
        escala: escalaEstable,
        error: error.message
      };
    }
  }, [escalaEstable]);

  // ===================== CONFIGURACIÓN DE OBSERVERS =====================
  const configurarObservers = useCallback(() => {
    if (!isActive) return;
    
    // Limpiar observers anteriores
    if (observersRef.current.mutation) {
      observersRef.current.mutation.disconnect();
    }
    if (observersRef.current.resize) {
      observersRef.current.resize.disconnect();
    }
    
    try {
      const setupObservers = () => {
        const viewer = document.querySelector('.rpv-core__viewer');
        const canvas = document.querySelector('.rpv-core__canvas-layer canvas');
        
        if (!viewer || !canvas) {
          // Reintentar después de un tiempo
          setTimeout(setupObservers, 1000);
          return;
        }
        
        // MutationObserver para cambios en el DOM
        observersRef.current.mutation = new MutationObserver((mutations) => {
          let debeActualizar = false;
          
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
              const target = mutation.target;
              if (target.style.transform || target.style.width || target.style.height) {
                debeActualizar = true;
              }
            }
          });
          
          if (debeActualizar) {
            actualizarEscala();
          }
        });
        
        // Observar cambios en el viewer y páginas
        observersRef.current.mutation.observe(viewer, {
          attributes: true,
          attributeFilter: ['style'],
          subtree: true
        });
        
        // ResizeObserver para cambios de tamaño
        if (window.ResizeObserver) {
          observersRef.current.resize = new ResizeObserver((entries) => {
            let hayResize = false;
            
            entries.forEach((entry) => {
              if (entry.target === canvas || entry.target.closest('.rpv-core__inner-page')) {
                hayResize = true;
              }
            });
            
            if (hayResize) {
              actualizarEscala();
            }
          });
          
          observersRef.current.resize.observe(canvas);
          
          // Observar también las páginas
          document.querySelectorAll('.rpv-core__inner-page').forEach((pagina) => {
            observersRef.current.resize.observe(pagina);
          });
        }
        
        console.log('👀 Observers de escala configurados correctamente');
        
        // Actualización inicial
        setTimeout(() => {
          actualizarEscala();
        }, 100);
      };
      
      setupObservers();
      
    } catch (error) {
      console.error('❌ Error configurando observers:', error);
    }
  }, [isActive, actualizarEscala]);

  // ===================== EFECTOS =====================
  
  // Efecto para configurar observers cuando se activa
  useEffect(() => {
    if (isActive) {
      configurarObservers();
    }
    
    return () => {
      if (observersRef.current.mutation) {
        observersRef.current.mutation.disconnect();
      }
      if (observersRef.current.resize) {
        observersRef.current.resize.disconnect();
      }
    };
  }, [isActive, configurarObservers]);

  // Efecto para actualizar desde visorInfo
  useEffect(() => {
    if (visorInfo?.scale && typeof visorInfo.scale === 'number') {
      const nuevaEscala = validarEscala(visorInfo.scale);
      if (Math.abs(nuevaEscala - escalaAnterior.current) > CONFIG.THRESHOLD_CAMBIO) {
        setEscalaEstable(nuevaEscala);
        escalaAnterior.current = nuevaEscala;
        
        // Invalidar cache para forzar nueva detección
        cacheInfoPDF.current.valida = false;
      }
    }
  }, [visorInfo?.scale, validarEscala, CONFIG]);

  // Efecto para actualización inicial
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        actualizarEscala();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, actualizarEscala]);

  // ===================== LIMPIEZA =====================
  useEffect(() => {
    return () => {
      if (timeoutDebounce.current) {
        clearTimeout(timeoutDebounce.current);
      }
      if (observersRef.current.mutation) {
        observersRef.current.mutation.disconnect();
      }
      if (observersRef.current.resize) {
        observersRef.current.resize.disconnect();
      }
    };
  }, []);

  // ===================== API PÚBLICA =====================
  return {
    // Escala principal
    currentPDFScale: escalaEstable,
    escalaValidada: escalaEstable,
    
    // Funciones de conversión
    convertirARelativas,
    convertirAEscaladas,
    escalarValor,
    
    // Información del PDF
    obtenerInfoPDF,
    
    // Control manual
    actualizarEscala,
    
    // Estado de debugging
    estadoDebug: {
      escalaAnterior: escalaAnterior.current,
      cacheValido: cacheInfoPDF.current.valida,
      ultimaDeteccion: ultimaDeteccion.current,
      observersActivos: {
        mutation: !!observersRef.current.mutation,
        resize: !!observersRef.current.resize
      }
    }
  };
}
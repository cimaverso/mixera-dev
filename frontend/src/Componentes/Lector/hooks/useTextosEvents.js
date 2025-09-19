// useTextosEvents.js - SISTEMA DE EVENTOS ROBUSTO CORREGIDO
import { useCallback, useRef, useEffect } from 'react';

export function useTextosEvents(escalaActual, onEditTexto, onSetGuardando = () => {}) {
  // ===================== REFERENCIAS CENTRALIZADAS =====================
  const eventListenersRef = useRef(new Map());
  const operacionesActivasRef = useRef(new Set());
  const estadoDragRef = useRef(new Map());
  const estadoResizeRef = useRef(new Map());

  // ===================== CONFIGURACIÓN =====================
  const CONFIG = {
    DRAG_THRESHOLD: 5,
    LONG_PRESS_TIME: 150,
    DEBOUNCE_TIME: 100,
    Z_INDEX: {
      BASE: 210,
      HOVER: 220,
      DRAGGING: 300,
      RESIZING: 290
    }
  };

  // ===================== UTILIDADES =====================
  
  const mostrarIndicadorTemporal = useCallback((mensaje, tipo = 'info') => {
    const colores = {
      info: '#2196f3',
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800'
    };
    
    const indicador = document.createElement('div');
    indicador.textContent = mensaje;
    indicador.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${colores[tipo]};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10001;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(indicador);
    
    setTimeout(() => {
      if (indicador.parentNode) {
        indicador.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => indicador.remove(), 300);
      }
    }, 2000);
  }, []);

  // ===================== EVENTOS DE HOVER OPTIMIZADOS =====================
  
  const configurarHoverEvents = useCallback((elemento, textoId) => {
    if (!elemento) return [];
    
    const contenido = elemento.querySelector('.texto-contenido-robusto');
    const resizeHandle = elemento.querySelector('.resize-handle-robusto');
    if (!contenido) return [];
    
    let hoverTimeout = null;
    
    const handleMouseEnter = () => {
      if (operacionesActivasRef.current.has(textoId) || 
          estadoDragRef.current.has(textoId) || 
          estadoResizeRef.current.has(textoId)) {
        return;
      }
      
      // Limpiar timeout si existe
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      
      // Aplicar estilos hover
      contenido.style.background = 'rgba(222, 0, 126, 0.08)';
      contenido.style.borderColor = 'rgba(222, 0, 126, 0.4)';
      contenido.style.borderStyle = 'dashed';
      contenido.style.boxShadow = `0 ${Math.round(4 * escalaActual)}px ${Math.round(12 * escalaActual)}px rgba(222, 0, 126, 0.2)`;
      elemento.style.zIndex = CONFIG.Z_INDEX.HOVER.toString();
      
      if (resizeHandle) {
        resizeHandle.style.display = 'block';
      }
    };

    const handleMouseLeave = () => {
      // Delay antes de quitar hover para evitar parpadeos
      hoverTimeout = setTimeout(() => {
        if (!estadoDragRef.current.has(textoId) && !estadoResizeRef.current.has(textoId)) {
          contenido.style.background = 'transparent';
          contenido.style.borderColor = 'transparent';
          contenido.style.borderStyle = 'solid';
          contenido.style.boxShadow = 'none';
          elemento.style.zIndex = CONFIG.Z_INDEX.BASE.toString();
          
          if (resizeHandle) {
            resizeHandle.style.display = 'none';
          }
        }
      }, 50);
    };

    elemento.addEventListener('mouseenter', handleMouseEnter);
    elemento.addEventListener('mouseleave', handleMouseLeave);

    return [
      () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        elemento.removeEventListener('mouseenter', handleMouseEnter);
        elemento.removeEventListener('mouseleave', handleMouseLeave);
      }
    ];
  }, [escalaActual, CONFIG.Z_INDEX]);

  // ===================== DRAG & DROP ROBUSTO =====================
  
  const configurarDragEvents = useCallback((elemento, texto, overlay, coordenadasOriginalesRef) => {
    if (!elemento || !overlay) return [];
    
    const textoId = texto.id.toString();
    let estadoDrag = null;
    
    const handleMouseDown = (e) => {
      // Verificaciones iniciales
      if (e.button !== 0 || 
          e.target.classList.contains('resize-handle-robusto') ||
          operacionesActivasRef.current.has(textoId)) {
        return;
      }
      
      e.stopPropagation();
      e.preventDefault();
      
      // Inicializar estado de drag
      estadoDrag = {
        iniciado: false,
        startTime: Date.now(),
        startPos: { x: e.clientX, y: e.clientY },
        initialCoords: coordenadasOriginalesRef.current.get(textoId) || { x: texto.x, y: texto.y },
        moved: false
      };
      
      estadoDragRef.current.set(textoId, estadoDrag);
      
      const handleMouseMove = (e) => {
        if (!estadoDragRef.current.has(textoId)) return;
        
        const currentState = estadoDragRef.current.get(textoId);
        const timeDiff = Date.now() - currentState.startTime;
        const distance = Math.sqrt(
          Math.pow(e.clientX - currentState.startPos.x, 2) + 
          Math.pow(e.clientY - currentState.startPos.y, 2)
        );
        
        // Iniciar drag si se supera el threshold
        if ((distance > CONFIG.DRAG_THRESHOLD || timeDiff > CONFIG.LONG_PRESS_TIME) && 
            !currentState.iniciado) {
          
          currentState.iniciado = true;
          currentState.moved = true;
          operacionesActivasRef.current.add(textoId);
          onSetGuardando(textoId);
          
          // Estilos visuales de drag
          elemento.dataset.dragging = 'true';
          elemento.style.zIndex = CONFIG.Z_INDEX.DRAGGING.toString();
          elemento.style.opacity = '0.85';
          elemento.style.filter = 'drop-shadow(0 8px 16px rgba(222, 0, 126, 0.4))';
          elemento.style.transform = 'translate(-50%, -50%) scale(1.02)';
          
          console.log('🎯 Drag iniciado:', textoId);
        }
        
        // Actualizar posición durante drag
        if (currentState.iniciado) {
          const overlayRect = overlay.getBoundingClientRect();
          if (overlayRect.width === 0 || overlayRect.height === 0) return;
          
          let newX = (e.clientX - overlayRect.left) / overlayRect.width;
          let newY = (e.clientY - overlayRect.top) / overlayRect.height;
          
          // Aplicar límites de seguridad
          newX = Math.max(0.05, Math.min(0.95, newX));
          newY = Math.max(0.05, Math.min(0.95, newY));
          
          elemento.style.left = `${newX * 100}%`;
          elemento.style.top = `${newY * 100}%`;
          
          // Actualizar coordenadas en tiempo real
          coordenadasOriginalesRef.current.set(textoId, {
            ...coordenadasOriginalesRef.current.get(textoId),
            x: newX,
            y: newY
          });
          
          currentState.finalCoords = { x: newX, y: newY };
        }
      };
      
      const handleMouseUp = async () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        const finalState = estadoDragRef.current.get(textoId);
        
        if (finalState?.iniciado && finalState?.moved && finalState?.finalCoords) {
          try {
            console.log('💾 Guardando nueva posición:', {
              id: textoId,
              coords: finalState.finalCoords
            });
            
            const coordenadasActuales = coordenadasOriginalesRef.current.get(textoId);
            
            await onEditTexto({
              id: texto.id,
              x: finalState.finalCoords.x,
              y: finalState.finalCoords.y,
              texto: texto.texto,
              width: coordenadasActuales?.width || texto.width,
              height: coordenadasActuales?.height || texto.height,
              fontSize: coordenadasActuales?.fontSize || texto.fontSize,
              pagina: texto.pagina
            });
            
            mostrarIndicadorTemporal('Posición guardada', 'success');
            
          } catch (error) {
            console.error('❌ Error guardando posición:', error);
            mostrarIndicadorTemporal('Error guardando posición', 'error');
            
            // Revertir posición en caso de error
            elemento.style.left = `${finalState.initialCoords.x * 100}%`;
            elemento.style.top = `${finalState.initialCoords.y * 100}%`;
            
            coordenadasOriginalesRef.current.set(textoId, {
              ...coordenadasOriginalesRef.current.get(textoId),
              x: finalState.initialCoords.x,
              y: finalState.initialCoords.y
            });
          }
        }
        
        // Limpiar estados visuales
        elemento.style.opacity = '1';
        elemento.style.zIndex = CONFIG.Z_INDEX.BASE.toString();
        elemento.style.filter = 'none';
        elemento.style.transform = 'translate(-50%, -50%)';
        delete elemento.dataset.dragging;
        
        // Limpiar estados de control
        estadoDragRef.current.delete(textoId);
        operacionesActivasRef.current.delete(textoId);
        onSetGuardando(false);
      };
      
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
    };

    elemento.addEventListener('mousedown', handleMouseDown, { passive: false });

    return [
      () => {
        elemento.removeEventListener('mousedown', handleMouseDown);
        estadoDragRef.current.delete(textoId);
      }
    ];
  }, [onEditTexto, onSetGuardando, CONFIG, mostrarIndicadorTemporal]);

  // ===================== RESIZE ROBUSTO =====================
  
  const configurarResizeEvents = useCallback((elemento, texto, coordenadasOriginalesRef) => {
    const resizeHandle = elemento.querySelector('.resize-handle-robusto');
    if (!resizeHandle) return [];
    
    const textoId = texto.id.toString();
    let estadoResize = null;
    
    const handleResizeStart = (e) => {
      if (operacionesActivasRef.current.has(textoId)) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      const coordenadasActuales = coordenadasOriginalesRef.current.get(textoId);
      
      estadoResize = {
        startX: e.clientX,
        startY: e.clientY,
        initialWidth: coordenadasActuales?.width || texto.width || 250,
        initialHeight: coordenadasActuales?.height || texto.height || 80,
        moved: false
      };
      
      estadoResizeRef.current.set(textoId, estadoResize);
      operacionesActivasRef.current.add(textoId);
      onSetGuardando(textoId);
      
      // Estilos visuales
      elemento.dataset.resizing = 'true';
      elemento.style.zIndex = CONFIG.Z_INDEX.RESIZING.toString();
      document.body.style.cursor = 'se-resize';
      
      console.log('📏 Resize iniciado:', textoId);
      
      const handleResizeMove = (e) => {
        if (!estadoResizeRef.current.has(textoId)) return;
        
        const currentState = estadoResizeRef.current.get(textoId);
        const deltaX = e.clientX - currentState.startX;
        const deltaY = e.clientY - currentState.startY;
        
        // Convertir delta a dimensiones base (sin escalar)
        const baseDeltaX = deltaX / escalaActual;
        const baseDeltaY = deltaY / escalaActual;
        
        // Calcular nuevas dimensiones base
        const newBaseWidth = Math.max(100, Math.min(600, currentState.initialWidth + baseDeltaX));
        const newBaseHeight = Math.max(40, Math.min(300, currentState.initialHeight + baseDeltaY));
        
        // Aplicar dimensiones escaladas al elemento
        const scaledWidth = Math.round(newBaseWidth * escalaActual);
        const scaledHeight = Math.round(newBaseHeight * escalaActual);
        
        elemento.style.width = `${scaledWidth}px`;
        elemento.style.height = `${scaledHeight}px`;
        
        // Actualizar coordenadas en tiempo real
        coordenadasOriginalesRef.current.set(textoId, {
          ...coordenadasOriginalesRef.current.get(textoId),
          width: newBaseWidth,
          height: newBaseHeight
        });
        
        currentState.finalWidth = newBaseWidth;
        currentState.finalHeight = newBaseHeight;
        currentState.moved = true;
      };
      
      const handleResizeEnd = async () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        
        const finalState = estadoResizeRef.current.get(textoId);
        
        if (finalState?.moved && finalState?.finalWidth && finalState?.finalHeight) {
          try {
            console.log('💾 Guardando nuevas dimensiones:', {
              id: textoId,
              width: finalState.finalWidth,
              height: finalState.finalHeight
            });
            
            const coordenadasActuales = coordenadasOriginalesRef.current.get(textoId);
            
            await onEditTexto({
              id: texto.id,
              x: coordenadasActuales?.x || texto.x,
              y: coordenadasActuales?.y || texto.y,
              texto: texto.texto,
              width: finalState.finalWidth,
              height: finalState.finalHeight,
              fontSize: coordenadasActuales?.fontSize || texto.fontSize,
              pagina: texto.pagina
            });
            
            mostrarIndicadorTemporal('Tamaño guardado', 'success');
            
          } catch (error) {
            console.error('❌ Error guardando dimensiones:', error);
            mostrarIndicadorTemporal('Error guardando tamaño', 'error');
            
            // Revertir dimensiones
            const revertWidth = Math.round(finalState.initialWidth * escalaActual);
            const revertHeight = Math.round(finalState.initialHeight * escalaActual);
            elemento.style.width = `${revertWidth}px`;
            elemento.style.height = `${revertHeight}px`;
            
            coordenadasOriginalesRef.current.set(textoId, {
              ...coordenadasOriginalesRef.current.get(textoId),
              width: finalState.initialWidth,
              height: finalState.initialHeight
            });
          }
        }
        
        // Limpiar estados
        delete elemento.dataset.resizing;
        elemento.style.zIndex = CONFIG.Z_INDEX.BASE.toString();
        document.body.style.cursor = '';
        
        estadoResizeRef.current.delete(textoId);
        operacionesActivasRef.current.delete(textoId);
        onSetGuardando(false);
      };
      
      document.addEventListener('mousemove', handleResizeMove, { passive: false });
      document.addEventListener('mouseup', handleResizeEnd, { passive: false });
    };

    resizeHandle.addEventListener('mousedown', handleResizeStart, { passive: false });

    return [
      () => {
        resizeHandle.removeEventListener('mousedown', handleResizeStart);
        estadoResizeRef.current.delete(textoId);
      }
    ];
  }, [escalaActual, onEditTexto, onSetGuardando, CONFIG, mostrarIndicadorTemporal]);

  // ===================== CONFIGURACIÓN COMPLETA DE EVENTOS =====================
  
  const configurarEventosCompletos = useCallback((elemento, texto, overlay, coordenadasOriginalesRef, onDoubleClick) => {
    if (!elemento || !texto) return [];
    
    const textoId = texto.id.toString();
    
    // Limpiar eventos anteriores
    const eventosAnteriores = eventListenersRef.current.get(textoId);
    if (eventosAnteriores) {
      eventosAnteriores.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
    }
    
    const cleanups = [];
    
    // Hover events
    const hoverCleanups = configurarHoverEvents(elemento, textoId);
    cleanups.push(...hoverCleanups);
    
    // Drag events
    if (overlay && coordenadasOriginalesRef) {
      const dragCleanups = configurarDragEvents(elemento, texto, overlay, coordenadasOriginalesRef);
      cleanups.push(...dragCleanups);
    }
    
    // Resize events
    if (coordenadasOriginalesRef) {
      const resizeCleanups = configurarResizeEvents(elemento, texto, coordenadasOriginalesRef);
      cleanups.push(...resizeCleanups);
    }
    
    // Double click para editar
    if (onDoubleClick) {
      const handleDoubleClick = (e) => {
        if (operacionesActivasRef.current.has(textoId)) return;
        
        e.stopPropagation();
        e.preventDefault();
        
        console.log('✏️ Doble click para editar:', textoId);
        onDoubleClick(texto);
      };
      
      elemento.addEventListener('dblclick', handleDoubleClick, { passive: false });
      cleanups.push(() => elemento.removeEventListener('dblclick', handleDoubleClick));
    }
    
    // Guardar cleanups
    eventListenersRef.current.set(textoId, cleanups);
    
    console.log(`🎧 Eventos configurados para texto: ${textoId}`);
    return cleanups;
    
  }, [configurarHoverEvents, configurarDragEvents, configurarResizeEvents]);

  // ===================== LIMPIEZA GENERAL =====================
  
  const limpiarTodosLosEventos = useCallback(() => {
    console.log('🧹 Limpiando todos los eventos de textos...');
    
    let totalLimpiados = 0;
    
    eventListenersRef.current.forEach((cleanups, textoId) => {
      if (Array.isArray(cleanups)) {
        cleanups.forEach(cleanup => {
          if (typeof cleanup === 'function') {
            try {
              cleanup();
              totalLimpiados++;
            } catch (error) {
              console.warn(`⚠️ Error limpiando evento para ${textoId}:`, error);
            }
          }
        });
      }
    });
    
    // Limpiar referencias
    eventListenersRef.current.clear();
    operacionesActivasRef.current.clear();
    estadoDragRef.current.clear();
    estadoResizeRef.current.clear();
    
    // Limpiar cursor global
    document.body.style.cursor = '';
    
    console.log(`✅ ${totalLimpiados} eventos limpiados correctamente`);
  }, []);

  // ===================== EFECTO DE LIMPIEZA =====================
  useEffect(() => {
    return () => {
      limpiarTodosLosEventos();
    };
  }, [limpiarTodosLosEventos]);

  // ===================== API PÚBLICA =====================
  return {
    configurarEventosCompletos,
    limpiarTodosLosEventos,
    
    // Estados internos para debugging
    estadoDebug: {
      eventListeners: eventListenersRef.current.size,
      operacionesActivas: operacionesActivasRef.current.size,
      dragsActivos: estadoDragRef.current.size,
      resizesActivos: estadoResizeRef.current.size
    }
  };
}
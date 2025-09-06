// useTextosEvents.js - Hook con integración backend para eventos de drag & drop y resize
import { useCallback, useRef } from 'react';

export function useTextosEvents(currentPDFScale, onEditTexto, setGuardandoTexto) {
  const eventosRef = useRef(new Map());

  // Configurar eventos de hover
  const configurarHoverEvents = useCallback((textoElement) => {
    const handleMouseEnter = () => {
      const contenido = textoElement.querySelector('.texto-contenido');
      const handles = textoElement.querySelector('.resize-handles');
      
      if (contenido) {
        contenido.style.background = 'rgba(33, 150, 243, 0.05)';
        contenido.style.borderColor = 'rgba(33, 150, 243, 0.3)';
        contenido.style.borderStyle = 'dashed';
        contenido.style.boxShadow = `0 ${Math.round(2 * currentPDFScale)}px ${Math.round(8 * currentPDFScale)}px rgba(33, 150, 243, 0.15)`;
      }
      
      if (handles) {
        handles.style.display = 'block';
      }
    };

    const handleMouseLeave = () => {
      if (!textoElement.dataset.dragging && !textoElement.dataset.resizing) {
        const contenido = textoElement.querySelector('.texto-contenido');
        const handles = textoElement.querySelector('.resize-handles');
        
        if (contenido) {
          contenido.style.background = 'transparent';
          contenido.style.borderColor = 'transparent';
          contenido.style.borderStyle = 'solid';
          contenido.style.boxShadow = 'none';
        }
        
        if (handles) {
          handles.style.display = 'none';
        }
      }
    };

    return { handleMouseEnter, handleMouseLeave };
  }, [currentPDFScale]);

  // Configurar eventos de drag & drop con backend
  const configurarDragEvents = useCallback((textoElement, texto, overlay) => {
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let dragOffset = { x: 0, y: 0 };

    const handleMouseDown = (e) => {
      if (e.target.classList.contains('resize-handle')) return;
      if (e.button !== 0) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      startPos = { x: e.clientX, y: e.clientY };
      
      const overlayRect = overlay.getBoundingClientRect();
      const textoRect = textoElement.getBoundingClientRect();
      const centerX = textoRect.left + textoRect.width / 2;
      const centerY = textoRect.top + textoRect.height / 2;
      
      dragOffset = {
        x: (e.clientX - centerX) / overlayRect.width,
        y: (e.clientY - centerY) / overlayRect.height
      };
      
      const handleMouseMove = (e) => {
        const distance = Math.sqrt(
          Math.pow(e.clientX - startPos.x, 2) + 
          Math.pow(e.clientY - startPos.y, 2)
        );
        
        if (distance > 5 && !isDragging) {
          isDragging = true;
          textoElement.dataset.dragging = 'true';
          textoElement.style.opacity = '0.8';
          textoElement.style.zIndex = '300';
          console.log('Drag iniciado para backend:', texto.id);
        }
        
        if (isDragging) {
          const currentOverlayRect = overlay.getBoundingClientRect();
          let newX = (e.clientX - currentOverlayRect.left) / currentOverlayRect.width - dragOffset.x;
          let newY = (e.clientY - currentOverlayRect.top) / currentOverlayRect.height - dragOffset.y;
          
          newX = Math.max(0.05, Math.min(0.95, newX));
          newY = Math.max(0.05, Math.min(0.95, newY));
          
          textoElement.style.left = `${newX * 100}%`;
          textoElement.style.top = `${newY * 100}%`;
        }
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        if (isDragging) {
          const finalOverlayRect = overlay.getBoundingClientRect();
          const finalTextoRect = textoElement.getBoundingClientRect();
          const finalCenterX = finalTextoRect.left + finalTextoRect.width / 2;
          const finalCenterY = finalTextoRect.top + finalTextoRect.height / 2;
          
          const finalX = (finalCenterX - finalOverlayRect.left) / finalOverlayRect.width;
          const finalY = (finalCenterY - finalOverlayRect.top) / finalOverlayRect.height;
          
          console.log('Guardando nueva posición en backend:', { 
            id: texto.id, 
            x: finalX.toFixed(4), 
            y: finalY.toFixed(4) 
          });
          
          setGuardandoTexto(texto.id);
          
          // CRÍTICO: onEditTexto devuelve Promise del backend
          onEditTexto({ 
            id: texto.id, 
            x: finalX, 
            y: finalY,
            texto: texto.texto,
            width: texto.width,
            height: texto.height,
            fontSize: texto.fontSize,
            pagina: texto.pagina
          }).then(() => {
            console.log('Posición guardada exitosamente en backend:', texto.id);
            setGuardandoTexto(false);
          }).catch((error) => {
            console.error('Error guardando posición en backend:', error);
            setGuardandoTexto(false);
            
            // Mostrar error visual
            mostrarErrorTemporal('Error guardando posición');
          });
          
          textoElement.style.opacity = '1';
          textoElement.style.zIndex = '210';
          delete textoElement.dataset.dragging;
          
          isDragging = false;
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    };

    return { handleMouseDown };
  }, [onEditTexto, setGuardandoTexto]);

  // Configurar eventos de resize con backend
  const configurarResizeEvents = useCallback((textoElement, texto) => {
    const resizeHandle = textoElement.querySelector('.resize-se');
    if (!resizeHandle) return null;

    let isResizing = false;
    let resizeStart = { x: 0, y: 0, width: 0, height: 0 };
    
    const handleResizeStart = (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      isResizing = true;
      textoElement.dataset.resizing = 'true';
      
      const rect = textoElement.getBoundingClientRect();
      resizeStart = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height
      };
      
      document.body.style.cursor = 'se-resize';
      
      const handleResizeMove = (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(Math.round(100 * currentPDFScale), resizeStart.width + deltaX);
        const newHeight = Math.max(Math.round(40 * currentPDFScale), resizeStart.height + deltaY);
        
        textoElement.style.width = `${newWidth}px`;
        textoElement.style.height = `${newHeight}px`;
      };
      
      const handleResizeEnd = () => {
        if (isResizing) {
          const finalRect = textoElement.getBoundingClientRect();
          
          // Convertir el tamaño escalado de vuelta a tamaño base
          const baseWidth = Math.round(finalRect.width / currentPDFScale);
          const baseHeight = Math.round(finalRect.height / currentPDFScale);
          
          console.log('Guardando nuevo tamaño en backend:', { 
            id: texto.id,
            scaledSize: `${finalRect.width}x${finalRect.height}`,
            baseSize: `${baseWidth}x${baseHeight}`,
            scale: currentPDFScale.toFixed(3)
          });
          
          setGuardandoTexto(texto.id);
          
          // CRÍTICO: onEditTexto devuelve Promise del backend
          onEditTexto({ 
            id: texto.id, 
            x: texto.x,
            y: texto.y,
            texto: texto.texto,
            width: baseWidth,
            height: baseHeight,
            fontSize: texto.fontSize,
            pagina: texto.pagina
          }).then(() => {
            console.log('Tamaño guardado exitosamente en backend:', texto.id);
            setGuardandoTexto(false);
          }).catch((error) => {
            console.error('Error guardando tamaño en backend:', error);
            setGuardandoTexto(false);
            
            // Mostrar error visual
            mostrarErrorTemporal('Error guardando tamaño');
          });
          
          isResizing = false;
          delete textoElement.dataset.resizing;
          document.body.style.cursor = '';
        }
        
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
      
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    };

    return { handleResizeStart };
  }, [currentPDFScale, onEditTexto, setGuardandoTexto]);

  // Función auxiliar para mostrar errores temporales
  const mostrarErrorTemporal = useCallback((mensaje) => {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = mensaje;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      z-index: 10001;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 3000);
  }, []);

  // Función principal para configurar todos los eventos de un texto con backend
  const configurarEventosTexto = useCallback((textoElement, texto, overlay, onDoubleClick) => {
    const textoId = texto.id.toString();
    
    // Limpiar eventos anteriores
    const eventosAnteriores = eventosRef.current.get(textoId);
    if (eventosAnteriores) {
      eventosAnteriores.forEach(cleanup => cleanup());
    }
    
    const cleanups = [];
    
    // Configurar hover
    const { handleMouseEnter, handleMouseLeave } = configurarHoverEvents(textoElement);
    textoElement.addEventListener('mouseenter', handleMouseEnter);
    textoElement.addEventListener('mouseleave', handleMouseLeave);
    cleanups.push(() => {
      textoElement.removeEventListener('mouseenter', handleMouseEnter);
      textoElement.removeEventListener('mouseleave', handleMouseLeave);
    });
    
    // Configurar drag & drop con backend
    const { handleMouseDown } = configurarDragEvents(textoElement, texto, overlay);
    textoElement.addEventListener('mousedown', handleMouseDown, { passive: false });
    cleanups.push(() => {
      textoElement.removeEventListener('mousedown', handleMouseDown);
    });
    
    // Configurar resize con backend
    const resizeEvents = configurarResizeEvents(textoElement, texto);
    if (resizeEvents) {
      const resizeHandle = textoElement.querySelector('.resize-se');
      resizeHandle.addEventListener('mousedown', resizeEvents.handleResizeStart);
      cleanups.push(() => {
        resizeHandle.removeEventListener('mousedown', resizeEvents.handleResizeStart);
      });
    }
    
    // Configurar doble click
    const handleDoubleClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('Doble click en texto para backend:', textoId);
      onDoubleClick(texto);
    };
    
    textoElement.addEventListener('dblclick', handleDoubleClick, { passive: false });
    cleanups.push(() => {
      textoElement.removeEventListener('dblclick', handleDoubleClick);
    });
    
    // Guardar cleanups
    eventosRef.current.set(textoId, cleanups);
    
    return cleanups;
  }, [configurarHoverEvents, configurarDragEvents, configurarResizeEvents]);

  // Limpiar todos los eventos
  const limpiarEventos = useCallback(() => {
    eventosRef.current.forEach(cleanups => {
      cleanups.forEach(cleanup => cleanup());
    });
    eventosRef.current.clear();
  }, []);

  return {
    configurarEventosTexto,
    limpiarEventos
  };
}
// TextosLayer.jsx - VERSIÓN PRODUCCIÓN LIMPIA
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import TextoModal from '../components/TextoModal';

const TextosLayer = ({
  herramientaActiva,
  paginaActual,
  visorInfo,
  textos = [],
  onAddTexto = () => {},
  onEditTexto = () => {},
  onDeleteTexto = () => {},
  onDesactivarHerramienta = () => {},
}) => {
  // ===================== ESTADO LOCAL =====================
  const activo = herramientaActiva === 'texto';
  const escalaOriginal = visorInfo?.scale || 1;
  
  const escalaControlada = useMemo(() => {
    const factor = Math.max(0.1, Math.min(5.0, escalaOriginal));
    return factor;
  }, [escalaOriginal]);
  
  // Referencias para gestión directa
  const overlaysRef = useRef(new Map());
  const textosElementsRef = useRef(new Map());
  const eventListenersRef = useRef(new Map());
  
  // Estados del modal y operaciones
  const [modalConfig, setModalConfig] = useState(null);
  const [operacionEnCurso, setOperacionEnCurso] = useState(false);
  const [textoGuardando, setTextoGuardando] = useState(null);
  
  // Estado para manejar zoom con debouncing
  const [escalaEstable, setEscalaEstable] = useState(escalaControlada);
  const timeoutZoomRef = useRef(null);
  
  // Estados para tracking de dimensiones reales
  const dimensionesRealesRef = useRef(new Map());
  const bloqueoEventosRef = useRef(new Set());

  // Configuración de dimensiones
  const DIMENSIONES = useMemo(() => ({
    MIN_WIDTH: 120,
    MAX_WIDTH: 800,
    MIN_HEIGHT: 50,
    MAX_HEIGHT: 400,
    DEFAULT_WIDTH: 300,
    DEFAULT_HEIGHT: 120,
    DEFAULT_FONT_SIZE: 16,
    ABSOLUTE_MIN_WIDTH: 30,
    ABSOLUTE_MIN_HEIGHT: 15,
    ABSOLUTE_MIN_FONT: 6
  }), []);

  // Debouncing para zoom
  useEffect(() => {
    if (timeoutZoomRef.current) {
      clearTimeout(timeoutZoomRef.current);
    }
    
    timeoutZoomRef.current = setTimeout(() => {
      setEscalaEstable(escalaControlada);
    }, 150);
    
    return () => {
      if (timeoutZoomRef.current) {
        clearTimeout(timeoutZoomRef.current);
      }
    };
  }, [escalaControlada]);

  // ===================== UTILIDADES AUXILIARES =====================
  
  const mostrarIndicadorGuardado = useCallback((textoId, mostrar) => {
    const elemento = textosElementsRef.current.get(textoId);
    if (!elemento) return;
    
    const indicador = elemento.querySelector('.indicador-guardado-mejorado');
    if (indicador) {
      indicador.style.display = mostrar ? 'flex' : 'none';
    }
    
    if (mostrar) {
      setTextoGuardando(textoId);
    } else {
      setTextoGuardando(null);
    }
  }, []);

  const mostrarError = useCallback((mensaje) => {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = mensaje;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10001;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
      animation: slideInRight 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => errorDiv.remove(), 300);
      }
    }, 4000);
  }, []);

  // ===================== VALIDACIÓN DE DIMENSIONES =====================
  
  const validarDimensiones = useCallback((width, height, fontSize) => {
    const validWidth = Math.max(
      DIMENSIONES.MIN_WIDTH, 
      Math.min(DIMENSIONES.MAX_WIDTH, width || DIMENSIONES.DEFAULT_WIDTH)
    );
    
    const validHeight = Math.max(
      DIMENSIONES.MIN_HEIGHT, 
      Math.min(DIMENSIONES.MAX_HEIGHT, height || DIMENSIONES.DEFAULT_HEIGHT)
    );
    
    const validFontSize = Math.max(10, Math.min(28, fontSize || DIMENSIONES.DEFAULT_FONT_SIZE));
    
    const factorEscalado = escalaEstable;
    
    const rawScaledWidth = validWidth * factorEscalado;
    const rawScaledHeight = validHeight * factorEscalado;
    const rawScaledFontSize = validFontSize * factorEscalado;
    
    // Aplicar límites absolutos para evitar desaparición
    const scaledWidth = Math.max(DIMENSIONES.ABSOLUTE_MIN_WIDTH, Math.round(rawScaledWidth));
    const scaledHeight = Math.max(DIMENSIONES.ABSOLUTE_MIN_HEIGHT, Math.round(rawScaledHeight));
    const scaledFontSize = Math.max(DIMENSIONES.ABSOLUTE_MIN_FONT, Math.round(rawScaledFontSize));
    
    const basePadding = 8;
    const baseBorderRadius = 6;
    const scaledPadding = Math.max(2, Math.min(16, Math.round(basePadding * factorEscalado)));
    const scaledBorderRadius = Math.max(2, Math.min(12, Math.round(baseBorderRadius * factorEscalado)));
    
    return {
      baseWidth: validWidth,
      baseHeight: validHeight,
      baseFontSize: validFontSize,
      scaledWidth,
      scaledHeight,
      scaledFontSize,
      scaledPadding,
      scaledBorderRadius,
      factorEscalado,
      rawScaledWidth,
      rawScaledHeight,
      isMinimumSize: scaledWidth === DIMENSIONES.ABSOLUTE_MIN_WIDTH || scaledHeight === DIMENSIONES.ABSOLUTE_MIN_HEIGHT
    };
  }, [escalaEstable, DIMENSIONES]);

  // ===================== VERIFICACIÓN DE LÍMITE POR PÁGINA =====================
  
  const verificarLimitePorPagina = useCallback((numeroPagina) => {
    const textosEnPagina = textos.filter(t => t.pagina === numeroPagina);
    const limite = 1;
    
    if (textosEnPagina.length >= limite) {
      mostrarError(`Solo se permite ${limite} texto por página. Esta página ya tiene ${textosEnPagina.length}.`);
      return false;
    }
    
    return true;
  }, [textos, mostrarError]);

  // ===================== DESACTIVACIÓN COMPLETA =====================
  
  const desactivarCompletamente = useCallback(() => {
    // Limpiar todos los overlays activos
    overlaysRef.current.forEach((overlay, numeroPagina) => {
      if (overlay && overlay.parentNode) {
        overlay.style.pointerEvents = 'none';
        overlay.style.cursor = 'default';
        overlay.style.background = 'transparent';
        overlay.style.border = 'none';
        overlay.dataset.activo = 'false';
        
        const eventoAnterior = overlay._clickHandler;
        if (eventoAnterior) {
          overlay.removeEventListener('mousedown', eventoAnterior);
          overlay._clickHandler = null;
        }
      }
    });
    
    // Limpiar eventos de elementos de texto
    eventListenersRef.current.forEach(cleanups => {
      cleanups.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
    });
    eventListenersRef.current.clear();
    
    // Remover estilos de hover de todos los elementos
    textosElementsRef.current.forEach((elemento, textoId) => {
      if (elemento && elemento.parentNode) {
        const contenido = elemento.querySelector('.texto-contenido-mejorado');
        const resizeHandle = elemento.querySelector('.resize-handle-mejorado');
        
        if (contenido) {
          contenido.style.background = 'transparent';
          contenido.style.borderColor = 'transparent';
          contenido.style.borderStyle = 'solid';
          contenido.style.boxShadow = 'none';
          contenido.style.color = 'rgba(26, 26, 26, 0.7)';
        }
        
        if (resizeHandle) {
          resizeHandle.style.display = 'none';
        }
        
        elemento.style.cursor = 'default';
        elemento.style.pointerEvents = 'none';
        elemento.style.zIndex = '210';
      }
    });
    
    // Limpiar estados
    setModalConfig(null);
    setOperacionEnCurso(false);
    setTextoGuardando(null);
    bloqueoEventosRef.current.clear();
  }, []);

  useEffect(() => {
    if (!activo) {
      desactivarCompletamente();
    }
  }, [activo, desactivarCompletamente]);

  // ===================== FUNCIONES DE DIMENSIONES =====================
  
  const actualizarDimensionesReales = useCallback((textoId, datos) => {
    const dimensionesActuales = dimensionesRealesRef.current.get(textoId.toString()) || {};
    
    const nuevasDimensiones = {
      ...dimensionesActuales,
      ...datos,
      timestamp: Date.now()
    };
    
    dimensionesRealesRef.current.set(textoId.toString(), nuevasDimensiones);
    return nuevasDimensiones;
  }, []);

  const obtenerDimensionesReales = useCallback((textoId) => {
    const dimensionesCache = dimensionesRealesRef.current.get(textoId.toString());
    
    if (dimensionesCache && (Date.now() - dimensionesCache.timestamp) < 1000) {
      return dimensionesCache;
    }
    
    const elemento = textosElementsRef.current.get(textoId.toString());
    if (elemento) {
      const baseWidth = parseFloat(elemento.dataset.baseWidth) || DIMENSIONES.DEFAULT_WIDTH;
      const baseHeight = parseFloat(elemento.dataset.baseHeight) || DIMENSIONES.DEFAULT_HEIGHT;
      
      const dimensionesDOM = {
        width: baseWidth,
        height: baseHeight,
        x: parseFloat(elemento.style.left) / 100,
        y: parseFloat(elemento.style.top) / 100,
        timestamp: Date.now()
      };
      
      dimensionesRealesRef.current.set(textoId.toString(), dimensionesDOM);
      return dimensionesDOM;
    }
    
    const textoEnEstado = textos.find(t => t.id.toString() === textoId.toString());
    return textoEnEstado ? {
      width: textoEnEstado.width || DIMENSIONES.DEFAULT_WIDTH,
      height: textoEnEstado.height || DIMENSIONES.DEFAULT_HEIGHT,
      x: textoEnEstado.x || 0.5,
      y: textoEnEstado.y || 0.5,
      timestamp: Date.now()
    } : null;
  }, [textos, DIMENSIONES]);

  // ===================== GESTIÓN DE OVERLAYS =====================
  
  const getOverlay = useCallback((numeroPagina) => {
    let overlay = overlaysRef.current.get(numeroPagina);
    
    if (!overlay || !overlay.parentNode || !document.contains(overlay)) {
      const paginaElement = document.querySelector(
        `.rpv-core__inner-page[aria-label="Page ${numeroPagina}"]`
      );
      
      if (!paginaElement) {
        return null;
      }
      
      overlay = document.createElement('div');
      overlay.className = 'textos-overlay-mejorado';
      overlay.dataset.pagina = numeroPagina.toString();
      overlay.dataset.activo = activo.toString();
      overlay.dataset.version = 'produccion-v1.0';
      
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: ${activo ? 'auto' : 'none'};
        z-index: 200;
        cursor: ${activo ? 'crosshair' : 'default'};
        overflow: visible;
        box-sizing: border-box;
        background: transparent;
        border: none;
      `;
      
      if (getComputedStyle(paginaElement).position === 'static') {
        paginaElement.style.position = 'relative';
      }
      
      paginaElement.appendChild(overlay);
      overlaysRef.current.set(numeroPagina, overlay);
    } else {
      overlay.dataset.activo = activo.toString();
      overlay.style.pointerEvents = activo ? 'auto' : 'none';
      overlay.style.cursor = activo ? 'crosshair' : 'default';
      overlay.style.background = 'transparent';
      overlay.style.border = 'none';
    }
    
    return overlay;
  }, [activo]);

  const convertirARelativas = useCallback((event, overlayElement) => {
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
      return null;
    }
  }, []);

  // ===================== CREACIÓN DE ELEMENTOS =====================
  
  const crearElementoTexto = useCallback((texto) => {
    const dimensiones = validarDimensiones(texto.width, texto.height, texto.fontSize);
    
    const textoContainer = document.createElement('div');
    textoContainer.className = 'texto-mejorado zoom-safe';
    textoContainer.dataset.textoId = texto.id.toString();
    textoContainer.dataset.pagina = texto.pagina.toString();
    textoContainer.dataset.version = 'produccion-v1.0';
    
    textoContainer.dataset.baseWidth = dimensiones.baseWidth.toString();
    textoContainer.dataset.baseHeight = dimensiones.baseHeight.toString();
    textoContainer.dataset.baseFontSize = dimensiones.baseFontSize.toString();
    
    textoContainer.style.cssText = `
      position: absolute;
      left: ${texto.x * 100}%;
      top: ${texto.y * 100}%;
      transform: translate(-50%, -50%);
      width: ${dimensiones.scaledWidth}px;
      height: ${dimensiones.scaledHeight}px;
      z-index: 210;
      cursor: ${activo ? 'pointer' : 'default'};
      pointer-events: ${activo ? 'auto' : 'none'};
      transition: width 0.1s ease, height 0.1s ease, font-size 0.1s ease;
      box-sizing: border-box;
      user-select: none;
      min-width: ${DIMENSIONES.ABSOLUTE_MIN_WIDTH}px !important;
      min-height: ${DIMENSIONES.ABSOLUTE_MIN_HEIGHT}px !important;
      max-width: 95vw;
      max-height: 95vh;
      opacity: ${dimensiones.isMinimumSize ? '0.8' : '1'};
    `;

    // Contenido
    const textoContent = document.createElement('div');
    textoContent.className = 'texto-contenido-mejorado texto-handwriting';
    textoContent.style.cssText = `
      width: 100%;
      height: 100%;
      background: transparent;
      color: rgba(26, 26, 26, ${dimensiones.isMinimumSize ? '0.9' : '0.7'});
      font-family: 'Indie Flower', cursive;
      font-size: ${dimensiones.scaledFontSize}px;
      font-weight: ${dimensiones.isMinimumSize ? '600' : '400'};
      padding: ${dimensiones.scaledPadding}px;
      border: 2px solid transparent;
      border-radius: ${dimensiones.scaledBorderRadius}px;
      box-sizing: border-box;
      word-wrap: break-word;
      white-space: pre-wrap;
      overflow: hidden;
      line-height: ${dimensiones.isMinimumSize ? '1.2' : '1.4'};
      cursor: inherit;
      transition: all 0.1s ease;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      position: relative;
      text-shadow: 0 0 2px rgba(255,255,255,0.5);
      letter-spacing: ${dimensiones.isMinimumSize ? '0.2px' : '0.5px'};
      min-height: ${DIMENSIONES.ABSOLUTE_MIN_HEIGHT - 4}px !important;
      min-width: ${DIMENSIONES.ABSOLUTE_MIN_WIDTH - 4}px !important;
    `;
    textoContent.textContent = texto.texto;

    // Handle de resize
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle-mejorado';
    const handleSize = Math.max(8, Math.min(20, Math.round(12 * dimensiones.factorEscalado)));
    resizeHandle.style.cssText = `
      display: none;
      position: absolute;
      bottom: ${Math.round(-4 * dimensiones.factorEscalado)}px;
      right: ${Math.round(-4 * dimensiones.factorEscalado)}px;
      width: ${handleSize}px;
      height: ${handleSize}px;
      background: #de007e;
      border: 2px solid white;
      border-radius: 50%;
      cursor: se-resize;
      pointer-events: auto;
      z-index: 1001;
      box-shadow: 0 ${Math.round(2 * dimensiones.factorEscalado)}px ${Math.round(6 * dimensiones.factorEscalado)}px rgba(222, 0, 126, 0.4);
      transition: all 0.1s ease;
      min-width: 8px !important;
      min-height: 8px !important;
    `;

    // Indicador de guardado
    const indicadorGuardado = document.createElement('div');
    indicadorGuardado.className = 'indicador-guardado-mejorado';
    const indicatorSize = Math.max(12, Math.min(24, Math.round(20 * dimensiones.factorEscalado)));
    indicadorGuardado.style.cssText = `
      display: none;
      position: absolute;
      top: ${Math.round(-8 * dimensiones.factorEscalado)}px;
      right: ${Math.round(-8 * dimensiones.factorEscalado)}px;
      background: #de007e;
      color: white;
      border-radius: 50%;
      width: ${indicatorSize}px;
      height: ${indicatorSize}px;
      align-items: center;
      justify-content: center;
      font-size: ${Math.max(8, Math.min(14, Math.round(10 * dimensiones.factorEscalado)))}px;
      z-index: 1002;
      animation: pulse 1.5s infinite;
      box-shadow: 0 ${Math.round(2 * dimensiones.factorEscalado)}px ${Math.round(8 * dimensiones.factorEscalado)}px rgba(222, 0, 126, 0.5);
      border: 2px solid rgba(255, 255, 255, 0.9);
      font-weight: bold;
      min-width: 12px !important;
      min-height: 12px !important;
    `;
    indicadorGuardado.textContent = '💾';

    textoContainer.appendChild(textoContent);
    textoContainer.appendChild(resizeHandle);
    textoContainer.appendChild(indicadorGuardado);

    actualizarDimensionesReales(texto.id, {
      width: dimensiones.baseWidth,
      height: dimensiones.baseHeight,
      x: texto.x,
      y: texto.y
    });

    return textoContainer;
  }, [validarDimensiones, DIMENSIONES, actualizarDimensionesReales, activo, escalaEstable]);

  // ===================== GESTIÓN DE EVENTOS =====================
  
  const configurarEventosTexto = useCallback((textoElement, texto) => {
    if (!activo) {
      return [];
    }
    
    const textoId = texto.id.toString();
    
    const eventosAnteriores = eventListenersRef.current.get(textoId);
    if (eventosAnteriores) {
      eventosAnteriores.forEach(cleanup => cleanup());
    }
    
    const cleanups = [];
    const contenido = textoElement.querySelector('.texto-contenido-mejorado');
    const resizeHandle = textoElement.querySelector('.resize-handle-mejorado');
    
    // Eventos hover
    const handleMouseEnter = () => {
      if (!activo || operacionEnCurso || bloqueoEventosRef.current.has(textoId)) return;
      
      contenido.style.background = 'rgba(222, 0, 126, 0.08)';
      contenido.style.borderColor = 'rgba(222, 0, 126, 0.4)';
      contenido.style.borderStyle = 'dashed';
      contenido.style.boxShadow = `0 ${Math.round(3 * escalaEstable)}px ${Math.round(12 * escalaEstable)}px rgba(222, 0, 126, 0.2)`;
      contenido.style.color = 'rgba(26, 26, 26, 0.9)';
      
      if (resizeHandle) {
        resizeHandle.style.display = 'block';
      }
    };

    const handleMouseLeave = () => {
      if (!textoElement.dataset.dragging && !textoElement.dataset.resizing) {
        contenido.style.background = 'transparent';
        contenido.style.borderColor = 'transparent';
        contenido.style.borderStyle = 'solid';
        contenido.style.boxShadow = 'none';
        contenido.style.color = 'rgba(26, 26, 26, 0.7)';
        
        if (resizeHandle) {
          resizeHandle.style.display = 'none';
        }
      }
    };

    // Doble click para editar
    const handleDoubleClick = (e) => {
      if (!activo || operacionEnCurso || bloqueoEventosRef.current.has(textoId)) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      bloqueoEventosRef.current.add(textoId);
      setTimeout(() => {
        bloqueoEventosRef.current.delete(textoId);
      }, 500);
      
      abrirModalEdicion(texto);
    };

    // Drag & drop
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let dragOffset = { x: 0, y: 0 };

    const handleMouseDown = (e) => {
      if (!activo || operacionEnCurso || e.target === resizeHandle || bloqueoEventosRef.current.has(textoId)) return;
      if (e.button !== 0) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      startPos = { x: e.clientX, y: e.clientY };
      
      const overlay = getOverlay(texto.pagina);
      if (!overlay) return;
      
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
          setOperacionEnCurso(true);
          bloqueoEventosRef.current.add(textoId);
          
          textoElement.dataset.dragging = 'true';
          textoElement.style.opacity = '0.8';
          textoElement.style.zIndex = '300';
          textoElement.style.filter = 'drop-shadow(0 6px 12px rgba(222, 0, 126, 0.4))';
        }
        
        if (isDragging) {
          const currentOverlayRect = overlay.getBoundingClientRect();
          let newX = (e.clientX - currentOverlayRect.left) / currentOverlayRect.width - dragOffset.x;
          let newY = (e.clientY - currentOverlayRect.top) / currentOverlayRect.height - dragOffset.y;
          
          newX = Math.max(0.05, Math.min(0.95, newX));
          newY = Math.max(0.05, Math.min(0.95, newY));
          
          textoElement.style.left = `${newX * 100}%`;
          textoElement.style.top = `${newY * 100}%`;
          
          actualizarDimensionesReales(textoId, { x: newX, y: newY });
        }
      };
      
      const handleMouseUp = async () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        if (isDragging) {
          const finalOverlayRect = overlay.getBoundingClientRect();
          const finalTextoRect = textoElement.getBoundingClientRect();
          const finalCenterX = finalTextoRect.left + finalTextoRect.width / 2;
          const finalCenterY = finalTextoRect.top + finalTextoRect.height / 2;
          
          const finalX = (finalCenterX - finalOverlayRect.left) / finalOverlayRect.width;
          const finalY = (finalCenterY - finalOverlayRect.top) / finalOverlayRect.height;
          
          try {
            mostrarIndicadorGuardado(textoId, true);
            
            const dimensionesActuales = obtenerDimensionesReales(textoId);
            
            await onEditTexto({ 
              id: texto.id, 
              x: finalX, 
              y: finalY,
              texto: texto.texto,
              width: dimensionesActuales?.width || texto.width,
              height: dimensionesActuales?.height || texto.height,
              fontSize: texto.fontSize,
              pagina: texto.pagina
            });
            
            actualizarDimensionesReales(textoId, {
              x: finalX,
              y: finalY,
              width: dimensionesActuales?.width || texto.width,
              height: dimensionesActuales?.height || texto.height
            });
          } catch (error) {
            mostrarError('Error guardando posición');
          } finally {
            mostrarIndicadorGuardado(textoId, false);
          }
          
          textoElement.style.opacity = '1';
          textoElement.style.zIndex = '210';
          textoElement.style.filter = 'none';
          delete textoElement.dataset.dragging;
          isDragging = false;
          setOperacionEnCurso(false);
          
          setTimeout(() => {
            bloqueoEventosRef.current.delete(textoId);
          }, 200);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
    };

    // Resize
    let isResizing = false;
    let resizeStart = { x: 0, y: 0, baseWidth: 0, baseHeight: 0 };
    
    const handleResizeStart = (e) => {
      if (!activo || operacionEnCurso || bloqueoEventosRef.current.has(textoId)) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      isResizing = true;
      setOperacionEnCurso(true);
      bloqueoEventosRef.current.add(textoId);
      
      textoElement.dataset.resizing = 'true';
      
      const currentBaseWidth = parseFloat(textoElement.dataset.baseWidth);
      const currentBaseHeight = parseFloat(textoElement.dataset.baseHeight);
      
      resizeStart = {
        x: e.clientX,
        y: e.clientY,
        baseWidth: currentBaseWidth,
        baseHeight: currentBaseHeight
      };
      
      document.body.style.cursor = 'se-resize';
      
      const handleResizeMove = (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const baseDeltaX = deltaX / escalaEstable;
        const baseDeltaY = deltaY / escalaEstable;
        
        const newBaseWidth = Math.max(DIMENSIONES.MIN_WIDTH, Math.min(DIMENSIONES.MAX_WIDTH, resizeStart.baseWidth + baseDeltaX));
        const newBaseHeight = Math.max(DIMENSIONES.MIN_HEIGHT, Math.min(DIMENSIONES.MAX_HEIGHT, resizeStart.baseHeight + baseDeltaY));
        
        const newScaledWidth = Math.max(DIMENSIONES.ABSOLUTE_MIN_WIDTH, Math.round(newBaseWidth * escalaEstable));
        const newScaledHeight = Math.max(DIMENSIONES.ABSOLUTE_MIN_HEIGHT, Math.round(newBaseHeight * escalaEstable));
        
        textoElement.style.width = `${newScaledWidth}px`;
        textoElement.style.height = `${newScaledHeight}px`;
        
        textoElement.dataset.baseWidth = newBaseWidth.toString();
        textoElement.dataset.baseHeight = newBaseHeight.toString();
        
        actualizarDimensionesReales(textoId, { width: newBaseWidth, height: newBaseHeight });
      };
      
      const handleResizeEnd = async () => {
        if (isResizing) {
          const finalBaseWidth = parseFloat(textoElement.dataset.baseWidth);
          const finalBaseHeight = parseFloat(textoElement.dataset.baseHeight);
          
          try {
            mostrarIndicadorGuardado(textoId, true);
            
            const dimensionesActuales = obtenerDimensionesReales(textoId);
            
            await onEditTexto({ 
              id: texto.id, 
              x: dimensionesActuales?.x || texto.x,
              y: dimensionesActuales?.y || texto.y,
              texto: texto.texto,
              width: finalBaseWidth,
              height: finalBaseHeight,
              fontSize: texto.fontSize,
              pagina: texto.pagina
            });
            
            actualizarDimensionesReales(textoId, {
              width: finalBaseWidth,
              height: finalBaseHeight,
              x: dimensionesActuales?.x || texto.x,
              y: dimensionesActuales?.y || texto.y
            });
          } catch (error) {
            mostrarError('Error guardando tamaño');
          } finally {
            mostrarIndicadorGuardado(textoId, false);
          }
          
          isResizing = false;
          delete textoElement.dataset.resizing;
          document.body.style.cursor = '';
          setOperacionEnCurso(false);
          
          setTimeout(() => {
            bloqueoEventosRef.current.delete(textoId);
          }, 200);
        }
        
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
      
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    };

    if (activo) {
      textoElement.addEventListener('mouseenter', handleMouseEnter);
      textoElement.addEventListener('mouseleave', handleMouseLeave);
      textoElement.addEventListener('dblclick', handleDoubleClick);
      textoElement.addEventListener('mousedown', handleMouseDown);
      
      if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', handleResizeStart);
        cleanups.push(() => resizeHandle.removeEventListener('mousedown', handleResizeStart));
      }

      cleanups.push(() => {
        textoElement.removeEventListener('mouseenter', handleMouseEnter);
        textoElement.removeEventListener('mouseleave', handleMouseLeave);
        textoElement.removeEventListener('dblclick', handleDoubleClick);
        textoElement.removeEventListener('mousedown', handleMouseDown);
      });

      eventListenersRef.current.set(textoId, cleanups);
    }
    
    return cleanups;
  }, [activo, operacionEnCurso, getOverlay, onEditTexto, DIMENSIONES, obtenerDimensionesReales, actualizarDimensionesReales, escalaEstable, mostrarIndicadorGuardado, mostrarError]);

  // ===================== RENDERIZADO DE TEXTOS =====================
  
  const renderizarTextos = useCallback(() => {
    const textosActualesIds = new Set(textos.map(t => t.id.toString()));
    
    // Limpiar elementos que ya no existen
    textosElementsRef.current.forEach((elemento, textoId) => {
      if (!textosActualesIds.has(textoId)) {
        const eventos = eventListenersRef.current.get(textoId);
        if (eventos) {
          eventos.forEach(cleanup => cleanup());
          eventListenersRef.current.delete(textoId);
        }
        
        if (elemento.parentNode) {
          elemento.remove();
        }
        textosElementsRef.current.delete(textoId);
        
        dimensionesRealesRef.current.delete(textoId);
        bloqueoEventosRef.current.delete(textoId);
      }
    });

    // Renderizar textos
    textos.forEach(texto => {
      const textoId = texto.id.toString();
      let elementoExistente = textosElementsRef.current.get(textoId);
      
      const overlay = getOverlay(texto.pagina);
      if (!overlay) {
        return;
      }
      
      if (!elementoExistente || !elementoExistente.parentNode) {
        elementoExistente = crearElementoTexto(texto);
        overlay.appendChild(elementoExistente);
        textosElementsRef.current.set(textoId, elementoExistente);
        
        if (activo) {
          configurarEventosTexto(elementoExistente, texto);
        }
      } else {
        // Actualizar elemento existente para nuevo zoom
        const dimensiones = validarDimensiones(texto.width, texto.height, texto.fontSize);
        
        // Actualizar dimensiones principales
        elementoExistente.style.left = `${texto.x * 100}%`;
        elementoExistente.style.top = `${texto.y * 100}%`;
        elementoExistente.style.width = `${dimensiones.scaledWidth}px`;
        elementoExistente.style.height = `${dimensiones.scaledHeight}px`;
        elementoExistente.style.opacity = dimensiones.isMinimumSize ? '0.8' : '1';
        
        // Asegurar visibilidad mínima
        if (dimensiones.isMinimumSize) {
          elementoExistente.style.minWidth = `${DIMENSIONES.ABSOLUTE_MIN_WIDTH}px !important`;
          elementoExistente.style.minHeight = `${DIMENSIONES.ABSOLUTE_MIN_HEIGHT}px !important`;
        }
        
        // Actualizar interactividad según estado de herramienta
        elementoExistente.style.cursor = activo ? 'pointer' : 'default';
        elementoExistente.style.pointerEvents = activo ? 'auto' : 'none';
        
        elementoExistente.dataset.baseWidth = dimensiones.baseWidth.toString();
        elementoExistente.dataset.baseHeight = dimensiones.baseHeight.toString();
        elementoExistente.dataset.baseFontSize = dimensiones.baseFontSize.toString();
        
        const contenido = elementoExistente.querySelector('.texto-contenido-mejorado');
        if (contenido) {
          contenido.textContent = texto.texto;
          contenido.style.fontSize = `${dimensiones.scaledFontSize}px`;
          contenido.style.padding = `${dimensiones.scaledPadding}px`;
          contenido.style.borderRadius = `${dimensiones.scaledBorderRadius}px`;
          contenido.style.color = `rgba(26, 26, 26, ${dimensiones.isMinimumSize ? '0.9' : '0.7'})`;
          contenido.style.fontWeight = dimensiones.isMinimumSize ? '600' : '400';
          contenido.style.lineHeight = dimensiones.isMinimumSize ? '1.2' : '1.4';
          contenido.style.letterSpacing = dimensiones.isMinimumSize ? '0.2px' : '0.5px';
          
          // Asegurar tamaño mínimo del contenido
          contenido.style.minHeight = `${DIMENSIONES.ABSOLUTE_MIN_HEIGHT - 4}px !important`;
          contenido.style.minWidth = `${DIMENSIONES.ABSOLUTE_MIN_WIDTH - 4}px !important`;
          
          if (!activo) {
            contenido.style.background = 'transparent';
            contenido.style.borderColor = 'transparent';
            contenido.style.borderStyle = 'solid';
            contenido.style.boxShadow = 'none';
          }
        }
        
        const resizeHandle = elementoExistente.querySelector('.resize-handle-mejorado');
        if (resizeHandle) {
          const handleSize = Math.max(8, Math.min(20, Math.round(12 * dimensiones.factorEscalado)));
          resizeHandle.style.width = `${handleSize}px`;
          resizeHandle.style.height = `${handleSize}px`;
          resizeHandle.style.bottom = `${Math.round(-4 * dimensiones.factorEscalado)}px`;
          resizeHandle.style.right = `${Math.round(-4 * dimensiones.factorEscalado)}px`;
          resizeHandle.style.display = 'none';
          resizeHandle.style.minWidth = '8px !important';
          resizeHandle.style.minHeight = '8px !important';
        }
        
        const indicadorGuardado = elementoExistente.querySelector('.indicador-guardado-mejorado');
        if (indicadorGuardado) {
          const indicatorSize = Math.max(12, Math.min(24, Math.round(20 * dimensiones.factorEscalado)));
          indicadorGuardado.style.top = `${Math.round(-8 * dimensiones.factorEscalado)}px`;
          indicadorGuardado.style.right = `${Math.round(-8 * dimensiones.factorEscalado)}px`;
          indicadorGuardado.style.width = `${indicatorSize}px`;
          indicadorGuardado.style.height = `${indicatorSize}px`;
          indicadorGuardado.style.fontSize = `${Math.max(8, Math.min(14, Math.round(10 * dimensiones.factorEscalado)))}px`;
          indicadorGuardado.style.minWidth = '12px !important';
          indicadorGuardado.style.minHeight = '12px !important';
        }
      }
    });
  }, [textos, getOverlay, crearElementoTexto, configurarEventosTexto, validarDimensiones, activo, escalaEstable, DIMENSIONES]);

  // ===================== GESTIÓN DE MODALES =====================
  
  const cerrarModal = useCallback(() => {
    setModalConfig(null);
    setOperacionEnCurso(false);
    setTextoGuardando(null);
    bloqueoEventosRef.current.clear();
  }, []);

  const abrirModalCreacion = useCallback((numeroPagina, x, y) => {
    if (modalConfig || operacionEnCurso) {
      return;
    }

    if (!verificarLimitePorPagina(numeroPagina)) {
      return;
    }

    setOperacionEnCurso(true);
    
    setModalConfig({
      titulo: `Nuevo texto - Página ${numeroPagina}`,
      valor: '',
      fontSize: DIMENSIONES.DEFAULT_FONT_SIZE,
      width: DIMENSIONES.DEFAULT_WIDTH,
      height: DIMENSIONES.DEFAULT_HEIGHT,
      onGuardar: async (texto, fontSize, modalWidth, modalHeight) => {
        try {
          await onAddTexto({ 
            pagina: numeroPagina, 
            x, 
            y, 
            texto, 
            width: modalWidth || DIMENSIONES.DEFAULT_WIDTH,
            height: modalHeight || DIMENSIONES.DEFAULT_HEIGHT,
            fontSize: fontSize || DIMENSIONES.DEFAULT_FONT_SIZE
          });
          
          setOperacionEnCurso(false);
          setModalConfig(null);
          setTextoGuardando(null);
          bloqueoEventosRef.current.clear();
          
          setTimeout(() => {
            onDesactivarHerramienta();
            desactivarCompletamente();
          }, 100);
          
        } catch (error) {
          throw error;
        }
      },
      onCancelar: () => {
        cerrarModal();
        onDesactivarHerramienta();
      }
    });
  }, [modalConfig, operacionEnCurso, onAddTexto, onDesactivarHerramienta, DIMENSIONES, cerrarModal, verificarLimitePorPagina, desactivarCompletamente]);

  const abrirModalEdicion = useCallback((texto) => {
    if (modalConfig || operacionEnCurso) {
      return;
    }

    setOperacionEnCurso(true);
    
    const dimensionesReales = obtenerDimensionesReales(texto.id);
    
    setModalConfig({
      titulo: `Editar texto - Página ${texto.pagina}`,
      valor: texto.texto,
      fontSize: texto.fontSize || DIMENSIONES.DEFAULT_FONT_SIZE,
      width: dimensionesReales?.width || texto.width || DIMENSIONES.DEFAULT_WIDTH,
      height: dimensionesReales?.height || texto.height || DIMENSIONES.DEFAULT_HEIGHT,
      onGuardar: async (nuevoTexto, fontSize, modalWidth, modalHeight) => {
        try {
          const dimensionesActuales = obtenerDimensionesReales(texto.id);

          await onEditTexto({ 
            id: texto.id, 
            texto: nuevoTexto,
            x: dimensionesActuales?.x || texto.x,
            y: dimensionesActuales?.y || texto.y,
            width: modalWidth || dimensionesActuales?.width || texto.width,
            height: modalHeight || dimensionesActuales?.height || texto.height,
            pagina: texto.pagina,
            fontSize: fontSize || texto.fontSize
          });

          actualizarDimensionesReales(texto.id, {
            x: dimensionesActuales?.x || texto.x,
            y: dimensionesActuales?.y || texto.y,
            width: modalWidth || dimensionesActuales?.width || texto.width,
            height: modalHeight || dimensionesActuales?.height || texto.height
          });
          
          setOperacionEnCurso(false);
          setModalConfig(null);
          setTextoGuardando(null);
          bloqueoEventosRef.current.clear();
          
          setTimeout(() => {
            onDesactivarHerramienta();
            desactivarCompletamente();
          }, 100);
          
        } catch (error) {
          throw error;
        }
      },
      onCancelar: () => {
        cerrarModal();
      },
      onEliminar: async () => {
        try {
          await onDeleteTexto(texto.id);

          dimensionesRealesRef.current.delete(texto.id.toString());
          bloqueoEventosRef.current.delete(texto.id.toString());

          cerrarModal();
          
          setTimeout(() => {
            onDesactivarHerramienta();
            desactivarCompletamente();
          }, 100);
        } catch (error) {
          throw error;
        }
      }
    });
  }, [modalConfig, operacionEnCurso, onEditTexto, onDeleteTexto, onDesactivarHerramienta, DIMENSIONES, obtenerDimensionesReales, actualizarDimensionesReales, cerrarModal, desactivarCompletamente]);

  // ===================== MANEJO DE CLICKS EN OVERLAY =====================
  
  const handleOverlayClick = useCallback((numeroPagina, overlay) => {
    return (e) => {
      if (!activo || operacionEnCurso || modalConfig) return;
      
      if (e.target.closest('.texto-mejorado')) {
        return;
      }
      
      const coords = convertirARelativas(e, overlay);
      if (!coords) {
        return;
      }
      
      abrirModalCreacion(numeroPagina, coords.x, coords.y);
    };
  }, [activo, operacionEnCurso, modalConfig, convertirARelativas, abrirModalCreacion]);

  const configurarEventosOverlay = useCallback(() => {
    if (!activo) {
      return;
    }
    
    const paginas = document.querySelectorAll('.rpv-core__inner-page[aria-label^="Page "]');
    
    paginas.forEach((paginaElement) => {
      const ariaLabel = paginaElement.getAttribute('aria-label');
      const numeroPagina = parseInt(ariaLabel.replace('Page ', ''));
      
      if (isNaN(numeroPagina)) {
        return;
      }
      
      const overlay = getOverlay(numeroPagina);
      
      if (overlay) {
        const eventoAnterior = overlay._clickHandler;
        if (eventoAnterior) {
          overlay.removeEventListener('mousedown', eventoAnterior);
        }
        
        const clickHandler = handleOverlayClick(numeroPagina, overlay);
        overlay.addEventListener('mousedown', clickHandler, { passive: false });
        overlay._clickHandler = clickHandler;
      }
    });
  }, [activo, getOverlay, handleOverlayClick]);

  // ===================== EFECTOS PRINCIPALES =====================

  // Renderizar cuando la escala se estabilice
  useEffect(() => {
    if (visorInfo?.mode === 'single') {
      renderizarTextos();
    }
  }, [textos, escalaEstable, visorInfo?.mode, renderizarTextos]);

  // Renderizado inmediato para cambios de texto
  useEffect(() => {
    if (visorInfo?.mode === 'single') {
      renderizarTextos();
    }
  }, [textos.length, visorInfo?.mode, renderizarTextos]);

  useEffect(() => {
    if (visorInfo?.mode === 'single' && activo && !operacionEnCurso) {
      const timer = setTimeout(() => {
        bloqueoEventosRef.current.clear();
        
        textosElementsRef.current.forEach((elemento, textoId) => {
          const texto = textos.find(t => t.id.toString() === textoId);
          if (texto && elemento.parentNode) {
            configurarEventosTexto(elemento, texto);
          }
        });
        
        configurarEventosOverlay();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [textos.length, activo, operacionEnCurso, visorInfo?.mode, configurarEventosTexto, configurarEventosOverlay]);

  useEffect(() => {
    if (visorInfo?.mode === 'single' && activo) {
      const timer = setTimeout(() => {
        configurarEventosOverlay();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activo, visorInfo?.mode, configurarEventosOverlay]);

  useEffect(() => {
    return () => {
      eventListenersRef.current.forEach(cleanups => {
        cleanups.forEach(cleanup => cleanup());
      });
      eventListenersRef.current.clear();
      
      overlaysRef.current.forEach(overlay => {
        if (overlay.parentNode) {
          overlay.remove();
        }
      });
      overlaysRef.current.clear();
      
      textosElementsRef.current.clear();
      dimensionesRealesRef.current.clear();
      bloqueoEventosRef.current.clear();
    };
  }, []);

  if (visorInfo?.mode !== 'single') {
    return null;
  }

  // ===================== RENDER =====================

  return (
    <>
      <link href="https://fonts.googleapis.com/css?family=Indie+Flower&display=swap" rel="stylesheet" />
      
      {modalConfig && (
        <TextoModal
          isOpen={true}
          titulo={modalConfig.titulo}
          valor={modalConfig.valor || ''}
          fontSize={modalConfig.fontSize || DIMENSIONES.DEFAULT_FONT_SIZE}
          width={modalConfig.width || DIMENSIONES.DEFAULT_WIDTH}
          height={modalConfig.height || DIMENSIONES.DEFAULT_HEIGHT}
          currentPDFScale={escalaOriginal}
          onGuardar={modalConfig.onGuardar}
          onCancelar={modalConfig.onCancelar}
          onEliminar={modalConfig.onEliminar}
          showBackendStatus={true}
          modalColor="#de007e"
        />
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        .texto-handwriting {
          font-family: 'Indie Flower', cursive;
        }
        
        .textos-overlay-mejorado {
          transition: all 0.1s ease;
        }
        
        .texto-mejorado.zoom-safe {
          min-width: ${DIMENSIONES.ABSOLUTE_MIN_WIDTH}px !important;
          min-height: ${DIMENSIONES.ABSOLUTE_MIN_HEIGHT}px !important;
        }
        
        .texto-contenido-mejorado {
          min-height: ${DIMENSIONES.ABSOLUTE_MIN_HEIGHT - 4}px !important;
          min-width: ${DIMENSIONES.ABSOLUTE_MIN_WIDTH - 4}px !important;
        }
        
        .resize-handle-mejorado {
          min-width: 8px !important;
          min-height: 8px !important;
        }
        
        .indicador-guardado-mejorado {
          min-width: 12px !important;
          min-height: 12px !important;
        }
      `}</style>
    </>
  );
};

export default TextosLayer;
// TextosLayer.jsx - VERSIÓN CORREGIDA PARA ZOOM ROBUSTO
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
  // ===================== ESTADO CENTRALIZADO =====================
  const activo = herramientaActiva === 'texto';
  
  // NUEVO: Estado para manejo de escala estable
  const [escalaEstable, setEscalaEstable] = useState(1);
  const escalaAnteriorRef = useRef(1);
  const timeoutEscalaRef = useRef(null);
  
  // Referencias centralizadas
  const overlaysRef = useRef(new Map());
  const textosElementsRef = useRef(new Map());
  const coordenadasOriginalesRef = useRef(new Map());
  const eventListenersRef = useRef(new Map());
  
  // Estados del modal
  const [modalConfig, setModalConfig] = useState(null);
  const [operacionActiva, setOperacionActiva] = useState(false);
  const [clickDebounce, setClickDebounce] = useState(false);

  // ===================== CONFIGURACIÓN MEJORADA =====================
  const CONFIG = useMemo(() => ({
    DIMENSIONES: {
      MIN_WIDTH: 100,
      MAX_WIDTH: 600,
      MIN_HEIGHT: 40,
      MAX_HEIGHT: 300,
      DEFAULT_WIDTH: 250,
      DEFAULT_HEIGHT: 80,
      DEFAULT_FONT_SIZE: 16
    },
    Z_INDEX: {
      OVERLAY: 150,
      TEXTO_BASE: 210,
      TEXTO_DRAGGING: 300
    },
    LIMITES: {
      MIN_X: 0.05,
      MAX_X: 0.95,
      MIN_Y: 0.05,
      MAX_Y: 0.95
    },
    // NUEVO: Configuración para zoom extremo
    ZOOM_LIMITS: {
      MIN_VISIBLE_WIDTH: 20,
      MIN_VISIBLE_HEIGHT: 12,
      MIN_VISIBLE_FONT: 6,
      DEBOUNCE_TIME: 100,
      UPDATE_DELAY: 50,
      MIN_SCALE: 0.3,
      MAX_SCALE: 4.0
    },
    CLICK_TIMEOUT: 300
  }), []);

  // ===================== GESTIÓN DE ESCALA ROBUSTA =====================
  
  // CRÍTICO: Sincronización de escala con debounce
  useEffect(() => {
    const nuevaEscala = visorInfo?.scale || 1;
    const timestampCambio = visorInfo?.timestamp || 0;
    
    // Solo actualizar si hay cambio significativo
    if (Math.abs(nuevaEscala - escalaAnteriorRef.current) > 0.02) {
      // Limpiar timeout anterior
      if (timeoutEscalaRef.current) {
        clearTimeout(timeoutEscalaRef.current);
      }
      
      // Debounce la actualización de escala
      timeoutEscalaRef.current = setTimeout(() => {
        console.log(`🔍 TextosLayer: Escala sincronizada ${escalaAnteriorRef.current.toFixed(2)} → ${nuevaEscala.toFixed(2)}`);
        
        setEscalaEstable(nuevaEscala);
        escalaAnteriorRef.current = nuevaEscala;
        
        // CRÍTICO: Re-sincronizar textos con nueva escala
        if (activo) {
          setTimeout(() => {
            sincronizarTextos();
          }, CONFIG.ZOOM_LIMITS.UPDATE_DELAY);
        }
        
      }, CONFIG.ZOOM_LIMITS.DEBOUNCE_TIME);
    }
  }, [visorInfo?.scale, visorInfo?.timestamp, activo, CONFIG.ZOOM_LIMITS]);

  // ===================== VALIDACIÓN ROBUSTA DE DIMENSIONES =====================
  
  const validarDimensiones = useCallback((width, height, fontSize) => {
    // Validar escala antes de procesar
    const escalaSegura = Math.max(CONFIG.ZOOM_LIMITS.MIN_SCALE, 
                                  Math.min(CONFIG.ZOOM_LIMITS.MAX_SCALE, escalaEstable));
    
    const baseWidth = Math.max(CONFIG.DIMENSIONES.MIN_WIDTH, 
                               Math.min(CONFIG.DIMENSIONES.MAX_WIDTH, 
                                       width || CONFIG.DIMENSIONES.DEFAULT_WIDTH));
    const baseHeight = Math.max(CONFIG.DIMENSIONES.MIN_HEIGHT, 
                                Math.min(CONFIG.DIMENSIONES.MAX_HEIGHT, 
                                        height || CONFIG.DIMENSIONES.DEFAULT_HEIGHT));
    const baseFontSize = Math.max(12, Math.min(28, fontSize || CONFIG.DIMENSIONES.DEFAULT_FONT_SIZE));
    
    // PROTECCIÓN CRÍTICA: Asegurar visibilidad mínima independiente del zoom
    const rawScaledWidth = baseWidth * escalaSegura;
    const rawScaledHeight = baseHeight * escalaSegura;
    const rawScaledFontSize = baseFontSize * escalaSegura;
    
    const scaledWidth = Math.max(CONFIG.ZOOM_LIMITS.MIN_VISIBLE_WIDTH, Math.round(rawScaledWidth));
    const scaledHeight = Math.max(CONFIG.ZOOM_LIMITS.MIN_VISIBLE_HEIGHT, Math.round(rawScaledHeight));
    const scaledFontSize = Math.max(CONFIG.ZOOM_LIMITS.MIN_VISIBLE_FONT, Math.round(rawScaledFontSize));
    
    // Verificar si el elemento será visible
    const visible = scaledWidth >= CONFIG.ZOOM_LIMITS.MIN_VISIBLE_WIDTH && 
                   scaledHeight >= CONFIG.ZOOM_LIMITS.MIN_VISIBLE_HEIGHT && 
                   scaledFontSize >= CONFIG.ZOOM_LIMITS.MIN_VISIBLE_FONT;
    
    return {
      base: { width: baseWidth, height: baseHeight, fontSize: baseFontSize },
      scaled: {
        width: scaledWidth,
        height: scaledHeight,
        fontSize: scaledFontSize,
        padding: Math.max(1, Math.round(8 * escalaSegura)),
        borderRadius: Math.max(1, Math.round(6 * escalaSegura))
      },
      escala: escalaSegura,
      visible,
      tooSmall: !visible
    };
  }, [CONFIG, escalaEstable]);

  // ===================== UTILIDADES CORE MEJORADAS =====================
  
  const obtenerCoordenadasClick = useCallback((evento, overlay) => {
    if (!overlay || !evento || evento.type !== 'mousedown') return null;
    
    try {
      const rect = overlay.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      
      const x = (evento.clientX - rect.left) / rect.width;
      const y = (evento.clientY - rect.top) / rect.height;
      
      const xSeguro = Math.max(0.01, Math.min(0.99, x));
      const ySeguro = Math.max(0.01, Math.min(0.99, y));
      
      console.log('Click en coordenadas exactas:', {
        escala: escalaEstable.toFixed(2),
        coordenadas: { x: xSeguro, y: ySeguro },
        overlaySize: { width: rect.width, height: rect.height }
      });
      
      return { x: xSeguro, y: ySeguro };
    } catch (error) {
      console.error('Error calculando coordenadas de click:', error);
      return null;
    }
  }, [escalaEstable]);

  // ===================== GESTIÓN DE OVERLAYS MEJORADA =====================
  
  const crearOverlay = useCallback((numeroPagina) => {
    let overlay = overlaysRef.current.get(numeroPagina);
    if (overlay && overlay.parentNode && document.contains(overlay)) {
      // Actualizar estado del overlay existente
      overlay.dataset.activo = activo.toString();
      overlay.dataset.escala = escalaEstable.toFixed(2);
      overlay.style.pointerEvents = activo ? 'auto' : 'none';
      overlay.style.cursor = activo ? 'crosshair' : 'default';
      return overlay;
    }
    
    const paginaElement = document.querySelector(
      `.rpv-core__inner-page[aria-label="Page ${numeroPagina}"]`
    );
    
    if (!paginaElement) return null;
    
    overlay = document.createElement('div');
    overlay.className = 'textos-overlay-robusto';
    overlay.dataset.pagina = numeroPagina.toString();
    overlay.dataset.activo = activo.toString();
    overlay.dataset.escala = escalaEstable.toFixed(2);
    
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: ${CONFIG.Z_INDEX.OVERLAY};
      pointer-events: ${activo ? 'auto' : 'none'};
      cursor: ${activo ? 'crosshair' : 'default'};
      background: transparent;
      box-sizing: border-box;
    `;
    
    if (getComputedStyle(paginaElement).position === 'static') {
      paginaElement.style.position = 'relative';
    }
    
    paginaElement.appendChild(overlay);
    overlaysRef.current.set(numeroPagina, overlay);
    
    console.log(`Overlay creado para página ${numeroPagina} (escala: ${escalaEstable.toFixed(2)})`);
    return overlay;
  }, [activo, CONFIG.Z_INDEX, escalaEstable]);

  // ===================== CREACIÓN DE ELEMENTOS CORREGIDA =====================
  
  const crearElementoTexto = useCallback((texto, overlay) => {
    const dimensiones = validarDimensiones(texto.width, texto.height, texto.fontSize);
    
    // CRÍTICO: No crear si será invisible
    if (dimensiones.tooSmall) {
      console.warn(`⚠️ Texto ${texto.id} demasiado pequeño para mostrar con escala ${escalaEstable.toFixed(2)}`);
      return null;
    }
    
    const container = document.createElement('div');
    container.className = 'texto-handwriting-robusto';
    container.dataset.textoId = texto.id.toString();
    container.dataset.pagina = texto.pagina.toString();
    container.dataset.escala = escalaEstable.toFixed(2);
    
    // Guardar coordenadas exactas
    coordenadasOriginalesRef.current.set(texto.id.toString(), {
      x: texto.x,
      y: texto.y,
      width: dimensiones.base.width,
      height: dimensiones.base.height,
      fontSize: dimensiones.base.fontSize
    });
    
    // CORRECCIÓN CRÍTICA: Posicionamiento sin transform
    container.style.cssText = `
      position: absolute;
      left: ${texto.x * 100}%;
      top: ${texto.y * 100}%;
      width: ${dimensiones.scaled.width}px;
      height: ${dimensiones.scaled.height}px;
      z-index: ${CONFIG.Z_INDEX.TEXTO_BASE};
      cursor: ${activo ? 'pointer' : 'default'};
      pointer-events: ${activo ? 'auto' : 'none'};
      box-sizing: border-box;
      transition: none;
      transform: none;
      visibility: visible;
      opacity: 1;
    `;

    // Contenido con fuente handwriting
    const contenido = document.createElement('div');
    contenido.className = 'texto-contenido-handwriting-robusto';
    contenido.style.cssText = `
      width: 100%;
      height: 100%;
      background: transparent;
      color: #2c2c2c;
      font-family: 'Indie Flower', cursive, 'Comic Sans MS', sans-serif;
      font-size: ${dimensiones.scaled.fontSize}px;
      font-weight: 400;
      padding: ${dimensiones.scaled.padding}px;
      border: 2px solid transparent;
      border-radius: ${dimensiones.scaled.borderRadius}px;
      box-sizing: border-box;
      word-wrap: break-word;
      white-space: pre-wrap;
      overflow: hidden;
      line-height: 1.3;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      text-shadow: none;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      visibility: visible;
      opacity: 1;
    `;
    contenido.textContent = texto.texto;

    // Handle de resize (oculto inicialmente)
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle-robusto';
    resizeHandle.style.cssText = `
      display: none;
      position: absolute;
      bottom: -6px;
      right: -6px;
      width: 14px;
      height: 14px;
      background: #de007e;
      border: 2px solid white;
      border-radius: 50%;
      cursor: se-resize;
      pointer-events: auto;
      z-index: 1001;
      box-shadow: 0 2px 8px rgba(222, 0, 126, 0.4);
    `;

    container.appendChild(contenido);
    container.appendChild(resizeHandle);
    overlay.appendChild(container);
    
    textosElementsRef.current.set(texto.id.toString(), container);
    
    console.log(`✅ Texto ${texto.id} renderizado:`, {
      coordenadas: { x: texto.x, y: texto.y },
      dimensionesBase: dimensiones.base,
      dimensionesEscaladas: dimensiones.scaled,
      escala: escalaEstable.toFixed(2),
      visible: !dimensiones.tooSmall
    });
    
    return container;
  }, [validarDimensiones, activo, CONFIG.Z_INDEX, escalaEstable]);

  // ===================== ACTUALIZACIÓN INTELIGENTE DE ELEMENTOS =====================
  
  const actualizarElementoTexto = useCallback((elemento, texto) => {
    if (!elemento || !elemento.parentNode) return;
    
    const dimensiones = validarDimensiones(texto.width, texto.height, texto.fontSize);
    
    // CRÍTICO: Manejar elementos demasiado pequeños
    if (dimensiones.tooSmall) {
      console.warn(`⚠️ Texto ${texto.id} demasiado pequeño, ocultando`);
      elemento.style.visibility = 'hidden';
      elemento.style.pointerEvents = 'none';
      elemento.dataset.tooSmall = 'true';
      return;
    }
    
    // Restaurar visibilidad si estaba oculto
    if (elemento.dataset.tooSmall === 'true') {
      console.log(`✅ Texto ${texto.id} ahora visible con escala ${escalaEstable.toFixed(2)}`);
      delete elemento.dataset.tooSmall;
    }
    
    const coordenadasOriginales = coordenadasOriginalesRef.current.get(texto.id.toString());
    const x = coordenadasOriginales?.x ?? texto.x;
    const y = coordenadasOriginales?.y ?? texto.y;
    
    // CORRECCIÓN: Aplicar dimensiones y posición
    elemento.style.left = `${x * 100}%`;
    elemento.style.top = `${y * 100}%`;
    elemento.style.width = `${dimensiones.scaled.width}px`;
    elemento.style.height = `${dimensiones.scaled.height}px`;
    elemento.style.visibility = 'visible';
    elemento.style.opacity = '1';
    elemento.style.pointerEvents = activo ? 'auto' : 'none';
    elemento.style.transform = 'none';
    elemento.dataset.escala = escalaEstable.toFixed(2);
    
    const contenido = elemento.querySelector('.texto-contenido-handwriting-robusto');
    if (contenido) {
      contenido.textContent = texto.texto;
      contenido.style.fontSize = `${dimensiones.scaled.fontSize}px`;
      contenido.style.padding = `${dimensiones.scaled.padding}px`;
      contenido.style.visibility = 'visible';
      contenido.style.opacity = '1';
      
      if (!activo) {
        contenido.style.background = 'transparent';
        contenido.style.borderColor = 'transparent';
      }
    }
    
    // Actualizar coordenadas en cache preservando las exactas
    const coordenadasExistentes = coordenadasOriginalesRef.current.get(texto.id.toString());
    if (coordenadasExistentes) {
      coordenadasOriginalesRef.current.set(texto.id.toString(), {
        x: coordenadasExistentes.x,
        y: coordenadasExistentes.y,
        width: dimensiones.base.width,
        height: dimensiones.base.height,
        fontSize: dimensiones.base.fontSize
      });
    } else {
      coordenadasOriginalesRef.current.set(texto.id.toString(), {
        x, y,
        width: dimensiones.base.width,
        height: dimensiones.base.height,
        fontSize: dimensiones.base.fontSize
      });
    }
    
    console.log(`✅ Texto ${texto.id} actualizado para escala ${escalaEstable.toFixed(2)}`);
  }, [validarDimensiones, activo, escalaEstable]);

  // ===================== EVENTOS CON DRAG & DROP FUNCIONAL =====================
  
  const configurarEventosTexto = useCallback((elemento, texto, overlay, coordenadasOriginalesRef) => {
    if (!activo || !elemento) return [];
    
    const textoId = texto.id.toString();
    const cleanups = [];
    const contenido = elemento.querySelector('.texto-contenido-handwriting-robusto');
    const resizeHandle = elemento.querySelector('.resize-handle-robusto');
    
    // Estados de drag
    let isDragging = false;
    let dragStarted = false;
    let startPos = { x: 0, y: 0 };
    let initialCoords = null;

    // Hover events mejorados
    const handleMouseEnter = () => {
      if (!activo || operacionActiva || isDragging) return;
      if (elemento.dataset.tooSmall === 'true') return; // No hover si es muy pequeño
      
      contenido.style.background = 'rgba(222, 0, 126, 0.06)';
      contenido.style.borderColor = 'rgba(222, 0, 126, 0.3)';
      contenido.style.borderStyle = 'dashed';
      if (resizeHandle) resizeHandle.style.display = 'block';
    };

    const handleMouseLeave = () => {
      if (!isDragging && !elemento.dataset.editing) {
        contenido.style.background = 'transparent';
        contenido.style.borderColor = 'transparent';
        contenido.style.borderStyle = 'solid';
        if (resizeHandle) resizeHandle.style.display = 'none';
      }
    };

    // Doble click para editar
    const handleDoubleClick = (e) => {
      if (!activo || operacionActiva || isDragging || elemento.dataset.tooSmall === 'true') return;
      e.stopPropagation();
      e.preventDefault();
      abrirModalEdicion(texto);
    };

    // DRAG & DROP ROBUSTO
    const handleMouseDown = (e) => {
      if (!activo || operacionActiva || e.button !== 0 || 
          e.target.classList.contains('resize-handle-robusto') ||
          elemento.dataset.tooSmall === 'true') {
        return;
      }
      
      e.stopPropagation();
      e.preventDefault();
      
      isDragging = false;
      dragStarted = false;
      startPos = { x: e.clientX, y: e.clientY };
      
      const coordenadasOriginales = coordenadasOriginalesRef.current.get(textoId);
      initialCoords = coordenadasOriginales || { x: texto.x, y: texto.y };
      
      const handleMouseMove = (e) => {
        const distance = Math.sqrt(
          Math.pow(e.clientX - startPos.x, 2) + 
          Math.pow(e.clientY - startPos.y, 2)
        );
        
        if (distance > 5 && !dragStarted) {
          dragStarted = true;
          isDragging = true;
          setOperacionActiva(true);
          
          elemento.dataset.dragging = 'true';
          elemento.style.zIndex = CONFIG.Z_INDEX.TEXTO_DRAGGING.toString();
          elemento.style.opacity = '0.8';
          elemento.style.filter = 'drop-shadow(0 6px 12px rgba(222, 0, 126, 0.4))';
          
          console.log(`🎯 Drag iniciado: ${textoId} (escala: ${escalaEstable.toFixed(2)})`);
        }
        
        if (isDragging && overlay) {
          const overlayRect = overlay.getBoundingClientRect();
          if (overlayRect.width === 0 || overlayRect.height === 0) return;
          
          const newX = Math.max(0.01, Math.min(0.99, (e.clientX - overlayRect.left) / overlayRect.width));
          const newY = Math.max(0.01, Math.min(0.99, (e.clientY - overlayRect.top) / overlayRect.height));
          
          elemento.style.left = `${newX * 100}%`;
          elemento.style.top = `${newY * 100}%`;
          
          coordenadasOriginalesRef.current.set(textoId, {
            ...coordenadasOriginalesRef.current.get(textoId),
            x: newX,
            y: newY
          });
        }
      };
      
      const handleMouseUp = async () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        if (isDragging) {
          const coordenadasFinales = coordenadasOriginalesRef.current.get(textoId);
          
          try {
            console.log(`💾 Guardando nueva posición: ${textoId}`);
            
            await onEditTexto({
              id: texto.id,
              x: coordenadasFinales.x,
              y: coordenadasFinales.y,
              texto: texto.texto,
              width: coordenadasFinales.width,
              height: coordenadasFinales.height,
              fontSize: coordenadasFinales.fontSize,
              pagina: texto.pagina
            });
            
          } catch (error) {
            console.error('❌ Error guardando posición:', error);
            
            elemento.style.left = `${initialCoords.x * 100}%`;
            elemento.style.top = `${initialCoords.y * 100}%`;
            
            coordenadasOriginalesRef.current.set(textoId, {
              ...coordenadasOriginalesRef.current.get(textoId),
              x: initialCoords.x,
              y: initialCoords.y
            });
          }
          
          // Limpiar estados visuales
          elemento.style.opacity = '1';
          elemento.style.zIndex = CONFIG.Z_INDEX.TEXTO_BASE.toString();
          elemento.style.filter = 'none';
          delete elemento.dataset.dragging;
          
          isDragging = false;
          dragStarted = false;
          setOperacionActiva(false);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
    };

    // Registrar eventos
    elemento.addEventListener('mouseenter', handleMouseEnter);
    elemento.addEventListener('mouseleave', handleMouseLeave);
    elemento.addEventListener('dblclick', handleDoubleClick);
    elemento.addEventListener('mousedown', handleMouseDown);

    cleanups.push(
      () => elemento.removeEventListener('mouseenter', handleMouseEnter),
      () => elemento.removeEventListener('mouseleave', handleMouseLeave),
      () => elemento.removeEventListener('dblclick', handleDoubleClick),
      () => elemento.removeEventListener('mousedown', handleMouseDown)
    );

    eventListenersRef.current.set(textoId, cleanups);
    return cleanups;
  }, [activo, operacionActiva, CONFIG.Z_INDEX, onEditTexto, escalaEstable]);

  // ===================== MODAL MANAGEMENT MEJORADO =====================
  
  const abrirModalCreacion = useCallback((numeroPagina, coordenadas) => {
    if (operacionActiva || modalConfig || clickDebounce) return;
    
    console.log(`🆕 Creando texto en página ${numeroPagina} (escala: ${escalaEstable.toFixed(2)}):`, coordenadas);
    
    setClickDebounce(true);
    setOperacionActiva(true);
    
    setTimeout(() => setClickDebounce(false), CONFIG.CLICK_TIMEOUT);
    
    setModalConfig({
      titulo: `Nuevo texto - Página ${numeroPagina}`,
      valor: '',
      fontSize: CONFIG.DIMENSIONES.DEFAULT_FONT_SIZE,
      width: CONFIG.DIMENSIONES.DEFAULT_WIDTH,
      height: CONFIG.DIMENSIONES.DEFAULT_HEIGHT,
      onGuardar: async (texto, fontSize, modalWidth, modalHeight) => {
        try {
          console.log('💾 Guardando texto en coordenadas exactas:', coordenadas);
          
          await onAddTexto({
            pagina: numeroPagina,
            x: coordenadas.x,
            y: coordenadas.y,
            texto,
            width: modalWidth || CONFIG.DIMENSIONES.DEFAULT_WIDTH,
            height: modalHeight || CONFIG.DIMENSIONES.DEFAULT_HEIGHT,
            fontSize: fontSize || CONFIG.DIMENSIONES.DEFAULT_FONT_SIZE
          });
          
          setModalConfig(null);
          setOperacionActiva(false);
          
          setTimeout(() => {
            onDesactivarHerramienta();
          }, 100);
          
        } catch (error) {
          console.error('❌ Error creando texto:', error);
          throw error;
        }
      },
      onCancelar: () => {
        setModalConfig(null);
        setOperacionActiva(false);
        onDesactivarHerramienta();
      }
    });
  }, [operacionActiva, modalConfig, clickDebounce, CONFIG, onAddTexto, onDesactivarHerramienta, escalaEstable]);

  const abrirModalEdicion = useCallback((texto) => {
    if (operacionActiva || modalConfig) return;
    
    const coordenadasOriginales = coordenadasOriginalesRef.current.get(texto.id.toString());
    const dimensiones = coordenadasOriginales || {
      width: texto.width || CONFIG.DIMENSIONES.DEFAULT_WIDTH,
      height: texto.height || CONFIG.DIMENSIONES.DEFAULT_HEIGHT,
      fontSize: texto.fontSize || CONFIG.DIMENSIONES.DEFAULT_FONT_SIZE
    };
    
    setOperacionActiva(true);
    
    setModalConfig({
      titulo: `Editar texto - Página ${texto.pagina}`,
      valor: texto.texto,
      fontSize: dimensiones.fontSize,
      width: dimensiones.width,
      height: dimensiones.height,
      onGuardar: async (nuevoTexto, fontSize, modalWidth, modalHeight) => {
        try {
          const coordenadasActuales = coordenadasOriginalesRef.current.get(texto.id.toString());
          
          await onEditTexto({
            id: texto.id,
            texto: nuevoTexto,
            x: coordenadasActuales?.x || texto.x,
            y: coordenadasActuales?.y || texto.y,
            width: modalWidth || dimensiones.width,
            height: modalHeight || dimensiones.height,
            fontSize: fontSize || dimensiones.fontSize,
            pagina: texto.pagina
          });
          
          coordenadasOriginalesRef.current.set(texto.id.toString(), {
            x: coordenadasActuales?.x || texto.x,
            y: coordenadasActuales?.y || texto.y,
            width: modalWidth || dimensiones.width,
            height: modalHeight || dimensiones.height,
            fontSize: fontSize || dimensiones.fontSize
          });
          
          setModalConfig(null);
          setOperacionActiva(false);
          
          setTimeout(() => {
            onDesactivarHerramienta();
          }, 100);
          
        } catch (error) {
          console.error('❌ Error editando texto:', error);
          throw error;
        }
      },
      onCancelar: () => {
        setModalConfig(null);
        setOperacionActiva(false);
      },
      onEliminar: async () => {
        try {
          await onDeleteTexto(texto.id);
          coordenadasOriginalesRef.current.delete(texto.id.toString());
          
          setModalConfig(null);
          setOperacionActiva(false);
          
          setTimeout(() => {
            onDesactivarHerramienta();
          }, 100);
          
        } catch (error) {
          console.error('❌ Error eliminando texto:', error);
          throw error;
        }
      }
    });
  }, [operacionActiva, modalConfig, CONFIG.DIMENSIONES, onEditTexto, onDeleteTexto, onDesactivarHerramienta]);

  // ===================== CLICK HANDLER MEJORADO =====================
  
  const manejarClickOverlay = useCallback((numeroPagina, overlay) => {
    return (evento) => {
      if (evento.type !== 'mousedown' || 
          !activo || 
          operacionActiva || 
          modalConfig || 
          clickDebounce ||
          evento.button !== 0) {
        return;
      }
      
      if (evento.target.closest('.texto-handwriting-robusto')) {
        return;
      }
      
      evento.stopPropagation();
      evento.preventDefault();
      
      const coordenadas = obtenerCoordenadasClick(evento, overlay);
      if (!coordenadas) {
        console.warn('No se pudieron obtener coordenadas del click');
        return;
      }
      
      console.log(`✅ Click válido para crear texto (escala: ${escalaEstable.toFixed(2)})`);
      abrirModalCreacion(numeroPagina, coordenadas);
    };
  }, [activo, operacionActiva, modalConfig, clickDebounce, obtenerCoordenadasClick, abrirModalCreacion, escalaEstable]);

  // ===================== SINCRONIZACIÓN PRINCIPAL MEJORADA =====================
  
  const sincronizarTextos = useCallback(() => {
    if (visorInfo?.mode !== 'single') return;
    
    console.log(`🔄 Sincronizando textos (escala: ${escalaEstable.toFixed(2)}):`, {
      cantidad: textos.length,
      activo,
      modo: visorInfo?.mode
    });
    
    // Crear overlays
    const paginas = document.querySelectorAll('.rpv-core__inner-page[aria-label^="Page "]');
    
    paginas.forEach((paginaElement) => {
      const ariaLabel = paginaElement.getAttribute('aria-label');
      const numeroPagina = parseInt(ariaLabel.replace('Page ', ''));
      
      if (!isNaN(numeroPagina)) {
        const overlay = crearOverlay(numeroPagina);
        
        if (overlay && activo) {
          const handlerAnterior = overlay._clickHandler;
          if (handlerAnterior) {
            overlay.removeEventListener('mousedown', handlerAnterior);
          }
          
          const clickHandler = manejarClickOverlay(numeroPagina, overlay);
          overlay.addEventListener('mousedown', clickHandler, { passive: false });
          overlay._clickHandler = clickHandler;
        }
      }
    });
    
    // Gestionar textos
    const textosActualesIds = new Set(textos.map(t => t.id.toString()));
    const textosRenderizadosIds = new Set(textosElementsRef.current.keys());
    
    // Limpiar textos eliminados
    textosRenderizadosIds.forEach(textoId => {
      if (!textosActualesIds.has(textoId)) {
        const eventos = eventListenersRef.current.get(textoId);
        if (eventos) {
          eventos.forEach(cleanup => cleanup());
          eventListenersRef.current.delete(textoId);
        }
        
        const elemento = textosElementsRef.current.get(textoId);
        if (elemento && elemento.parentNode) {
          elemento.remove();
        }
        textosElementsRef.current.delete(textoId);
        coordenadasOriginalesRef.current.delete(textoId);
      }
    });
    
    // Crear/actualizar textos
    textos.forEach(texto => {
      const textoId = texto.id.toString();
      const overlay = overlaysRef.current.get(texto.pagina);
      
      if (!overlay) return;
      
      let elemento = textosElementsRef.current.get(textoId);
      
      if (!elemento || !elemento.parentNode) {
        elemento = crearElementoTexto(texto, overlay);
        if (elemento && activo) {
          configurarEventosTexto(elemento, texto, overlay, coordenadasOriginalesRef);
        }
      } else {
        actualizarElementoTexto(elemento, texto);
        if (activo) {
          const eventosAnteriores = eventListenersRef.current.get(textoId);
          if (eventosAnteriores) {
            eventosAnteriores.forEach(cleanup => cleanup());
          }
          if (elemento.dataset.tooSmall !== 'true') {
            configurarEventosTexto(elemento, texto, overlay, coordenadasOriginalesRef);
          }
        }
      }
    });
    
  }, [visorInfo?.mode, escalaEstable, textos, activo, crearOverlay, manejarClickOverlay, crearElementoTexto, configurarEventosTexto, actualizarElementoTexto]);

  // ===================== LIMPIEZA MEJORADA =====================
  
  const limpiarTodo = useCallback(() => {
    console.log(`🧹 Limpiando sistema de textos (escala: ${escalaEstable.toFixed(2)})`);
    
    // Limpiar eventos de overlays
    overlaysRef.current.forEach(overlay => {
      if (overlay && overlay.parentNode) {
        const handler = overlay._clickHandler;
        if (handler) {
          overlay.removeEventListener('mousedown', handler);
          overlay._clickHandler = null;
        }
        overlay.style.pointerEvents = 'none';
        overlay.style.cursor = 'default';
      }
    });
    
    // Limpiar todos los eventos de textos
    eventListenersRef.current.forEach(cleanups => {
      cleanups.forEach(cleanup => cleanup());
    });
    eventListenersRef.current.clear();
    
    // Limpiar estilos de textos
    textosElementsRef.current.forEach(elemento => {
      if (elemento && elemento.parentNode) {
        const contenido = elemento.querySelector('.texto-contenido-handwriting-robusto');
        const resizeHandle = elemento.querySelector('.resize-handle-robusto');
        
        if (contenido) {
          contenido.style.background = 'transparent';
          contenido.style.borderColor = 'transparent';
        }
        
        if (resizeHandle) {
          resizeHandle.style.display = 'none';
        }
        
        elemento.style.cursor = 'default';
        elemento.style.pointerEvents = 'none';
      }
    });
    
    setModalConfig(null);
    setOperacionActiva(false);
    setClickDebounce(false);
    
    // Limpiar timeouts
    if (timeoutEscalaRef.current) {
      clearTimeout(timeoutEscalaRef.current);
    }
    
    console.log('✅ Sistema de textos limpiado correctamente');
  }, [escalaEstable]);

  // ===================== EFECTOS MEJORADOS =====================
  
  useEffect(() => {
    if (visorInfo?.mode === 'single' && !operacionActiva) {
      const timer = setTimeout(() => {
        sincronizarTextos();
      }, CONFIG.ZOOM_LIMITS.UPDATE_DELAY);
      
      return () => clearTimeout(timer);
    }
  }, [textos, escalaEstable, activo, visorInfo?.mode, operacionActiva, sincronizarTextos, CONFIG.ZOOM_LIMITS]);
  
  useEffect(() => {
    if (!activo) {
      limpiarTodo();
    }
  }, [activo, limpiarTodo]);
  
  useEffect(() => {
    return () => {
      // Limpieza final
      if (timeoutEscalaRef.current) {
        clearTimeout(timeoutEscalaRef.current);
      }
      
      eventListenersRef.current.forEach(cleanups => {
        cleanups.forEach(cleanup => cleanup());
      });
      eventListenersRef.current.clear();
      
      overlaysRef.current.forEach(overlay => {
        if (overlay && overlay.parentNode) {
          overlay.remove();
        }
      });
      overlaysRef.current.clear();
      textosElementsRef.current.clear();
      coordenadasOriginalesRef.current.clear();
    };
  }, []);

  // ===================== RENDER =====================

  if (visorInfo?.mode !== 'single') {
    return null;
  }

  return (
    <React.Fragment>
      {/* Fuente Google Fonts */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Indie+Flower:wght@400&display=swap" 
        rel="stylesheet" 
      />
      
      {modalConfig && (
        <TextoModal
          isOpen={true}
          titulo={modalConfig.titulo}
          valor={modalConfig.valor}
          fontSize={modalConfig.fontSize}
          width={modalConfig.width}
          height={modalConfig.height}
          currentPDFScale={escalaEstable}
          onGuardar={modalConfig.onGuardar}
          onCancelar={modalConfig.onCancelar}
          onEliminar={modalConfig.onEliminar}
          showBackendStatus={true}
        />
      )}

      {/* Estado de zoom en desarrollo */}
      {process.env.NODE_ENV === 'development' && activo && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'rgba(222, 0, 126, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000,
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div>Escala: {escalaEstable.toFixed(2)}</div>
          <div>Textos: {textos.length}</div>
          <div>Visibles: {textosElementsRef.current.size}</div>
        </div>
      )}

      <style>{`
        .textos-overlay-robusto[data-activo="true"] {
          outline: 1px dashed rgba(222, 0, 126, 0.3);
          outline-offset: -1px;
        }
        
        .texto-handwriting-robusto {
          font-family: 'Indie Flower', cursive;
        }
        
        .texto-contenido-handwriting-robusto {
          font-family: 'Indie Flower', cursive, 'Comic Sans MS', sans-serif !important;
        }
        
        .resize-handle-robusto:hover {
          background: #c2185b !important;
          transform: scale(1.1);
          box-shadow: 0 3px 12px rgba(222, 0, 126, 0.6);
        }

        .texto-handwriting-robusto[data-dragging="true"] {
          cursor: grabbing !important;
        }

        .texto-handwriting-robusto[data-too-small="true"] {
          pointer-events: none !important;
          opacity: 0.3 !important;
        }
      `}</style>
    </React.Fragment>
  );
};

export default TextosLayer;
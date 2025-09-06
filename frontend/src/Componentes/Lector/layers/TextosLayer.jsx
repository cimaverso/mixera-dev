// TextosLayer.jsx - SISTEMA CONSOLIDADO SIN CONFLICTOS v2
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import TextoModal from '../components/TextoModal';

/**
 * TextosLayer - Sistema unificado para gestión de textos en PDF
 * 
 * Características:
 * - Sin dependencias externas (BaseLayer, PersistentRenderer)
 * - Gestión directa de overlays y elementos
 * - Coordenadas relativas consistentes (0-1)
 * - Escalado automático con zoom
 * - Integración limpia con backend
 */
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
  const escala = visorInfo?.scale || 1;
  
  // Referencias para gestión directa
  const overlaysRef = useRef(new Map()); // pagina -> overlay element
  const textosElementsRef = useRef(new Map()); // textoId -> texto element
  const eventListenersRef = useRef(new Map()); // textoId -> cleanup functions
  
  // Estados del modal y operaciones
  const [modalConfig, setModalConfig] = useState(null);
  const [operacionEnCurso, setOperacionEnCurso] = useState(false);
  const [textoGuardando, setTextoGuardando] = useState(null);

  // Configuración de dimensiones
  const DIMENSIONES = useMemo(() => ({
    MIN_WIDTH: 80,
    MAX_WIDTH: 600,
    MIN_HEIGHT: 30,
    MAX_HEIGHT: 400,
    DEFAULT_WIDTH: 200,
    DEFAULT_HEIGHT: 60,
    DEFAULT_FONT_SIZE: 14
  }), []);

  console.log('TextosLayer consolidado v2:', {
    activo,
    paginaActual,
    cantidadTextos: textos.length,
    escala: escala.toFixed(2),
    modal: !!modalConfig,
    operacion: operacionEnCurso
  });

  // ===================== GESTIÓN DE OVERLAYS =====================
  
  /**
   * Obtiene o crea overlay para una página específica
   */
  const getOverlay = useCallback((numeroPagina) => {
    let overlay = overlaysRef.current.get(numeroPagina);
    
    // Verificar si el overlay existe y está conectado
    if (!overlay || !overlay.parentNode || !document.contains(overlay)) {
      console.log(`Creando overlay para página ${numeroPagina}`);
      
      // Buscar elemento de página específico
      const paginaElement = document.querySelector(
        `.rpv-core__inner-page[aria-label="Page ${numeroPagina}"]`
      );
      
      if (!paginaElement) {
        console.warn(`No se encontró página ${numeroPagina}`);
        return null;
      }
      
      // Crear overlay unificado
      overlay = document.createElement('div');
      overlay.className = 'textos-overlay-consolidado';
      overlay.dataset.pagina = numeroPagina.toString();
      overlay.dataset.activo = activo.toString();
      overlay.dataset.version = 'consolidado-v2';
      
      // Configurar estilos del overlay
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: ${activo ? 'auto' : 'none'};
        z-index: 150;
        cursor: ${activo ? 'crosshair' : 'default'};
        overflow: visible;
        box-sizing: border-box;
        background: ${activo && process.env.NODE_ENV === 'development' ? 'rgba(0, 255, 0, 0.02)' : 'transparent'};
        border: ${activo && process.env.NODE_ENV === 'development' ? '1px dashed rgba(0, 255, 0, 0.3)' : 'none'};
      `;
      
      // Asegurar posición relativa en la página
      if (getComputedStyle(paginaElement).position === 'static') {
        paginaElement.style.position = 'relative';
      }
      
      // Agregar al DOM y registrar
      paginaElement.appendChild(overlay);
      overlaysRef.current.set(numeroPagina, overlay);
      
      console.log(`✅ Overlay creado para página ${numeroPagina}`);
    } else {
      // Actualizar estado existente
      overlay.dataset.activo = activo.toString();
      overlay.style.pointerEvents = activo ? 'auto' : 'none';
      overlay.style.cursor = activo ? 'crosshair' : 'default';
      
      if (process.env.NODE_ENV === 'development') {
        overlay.style.background = activo ? 'rgba(0, 255, 0, 0.02)' : 'transparent';
        overlay.style.border = activo ? '1px dashed rgba(0, 255, 0, 0.3)' : 'none';
      }
    }
    
    return overlay;
  }, [activo]);

  // ===================== UTILIDADES DE COORDENADAS =====================
  
  /**
   * Convierte coordenadas de evento a relativas (0-1)
   */
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
      console.warn('Error convirtiendo coordenadas:', error);
      return null;
    }
  }, []);

  /**
   * Valida y calcula dimensiones escaladas
   */
  const validarDimensiones = useCallback((width, height, fontSize) => {
    const validWidth = Math.max(
      DIMENSIONES.MIN_WIDTH, 
      Math.min(DIMENSIONES.MAX_WIDTH, width || DIMENSIONES.DEFAULT_WIDTH)
    );
    
    const validHeight = Math.max(
      DIMENSIONES.MIN_HEIGHT, 
      Math.min(DIMENSIONES.MAX_HEIGHT, height || DIMENSIONES.DEFAULT_HEIGHT)
    );
    
    const validFontSize = Math.max(10, Math.min(24, fontSize || DIMENSIONES.DEFAULT_FONT_SIZE));
    
    return {
      width: validWidth,
      height: validHeight,
      fontSize: validFontSize,
      scaledWidth: Math.round(validWidth * escala),
      scaledHeight: Math.round(validHeight * escala),
      scaledFontSize: Math.round(validFontSize * escala)
    };
  }, [escala, DIMENSIONES]);

  // ===================== CREACIÓN DE ELEMENTOS DE TEXTO =====================
  
  /**
   * Crea elemento DOM para un texto
   */
  const crearElementoTexto = useCallback((texto) => {
    const dimensiones = validarDimensiones(texto.width, texto.height, texto.fontSize);
    
    console.log(`🎨 Creando elemento texto: ${texto.id}`, {
      base: `${texto.width || DIMENSIONES.DEFAULT_WIDTH}x${texto.height || DIMENSIONES.DEFAULT_HEIGHT}`,
      escalado: `${dimensiones.scaledWidth}x${dimensiones.scaledHeight}`,
      escala: escala.toFixed(2)
    });
    
    // Container principal
    const textoContainer = document.createElement('div');
    textoContainer.className = 'texto-consolidado';
    textoContainer.dataset.textoId = texto.id.toString();
    textoContainer.dataset.pagina = texto.pagina.toString();
    textoContainer.dataset.version = 'consolidado-v2';
    
    textoContainer.style.cssText = `
      position: absolute;
      left: ${texto.x * 100}%;
      top: ${texto.y * 100}%;
      transform: translate(-50%, -50%);
      width: ${dimensiones.scaledWidth}px;
      height: ${dimensiones.scaledHeight}px;
      z-index: 210;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.2s ease;
      box-sizing: border-box;
      user-select: none;
      min-width: ${Math.round(DIMENSIONES.MIN_WIDTH * escala)}px;
      min-height: ${Math.round(DIMENSIONES.MIN_HEIGHT * escala)}px;
      max-width: ${Math.round(DIMENSIONES.MAX_WIDTH * escala)}px;
      max-height: ${Math.round(DIMENSIONES.MAX_HEIGHT * escala)}px;
    `;

    // Contenido del texto
    const textoContent = document.createElement('div');
    textoContent.className = 'texto-contenido-consolidado';
    textoContent.style.cssText = `
      width: 100%;
      height: 100%;
      background: transparent;
      color: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: ${dimensiones.scaledFontSize}px;
      font-weight: 500;
      padding: ${Math.round(8 * escala)}px ${Math.round(12 * escala)}px;
      border: 2px solid transparent;
      border-radius: ${Math.round(6 * escala)}px;
      box-sizing: border-box;
      word-wrap: break-word;
      white-space: pre-wrap;
      overflow: hidden;
      line-height: 1.4;
      text-shadow: 0 0 3px rgba(255,255,255,0.8);
      cursor: inherit;
      transition: all 0.2s ease;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      position: relative;
    `;
    textoContent.textContent = texto.texto;

    // Handle de resize
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle-consolidado';
    resizeHandle.style.cssText = `
      display: none;
      position: absolute;
      bottom: ${Math.round(-4 * escala)}px;
      right: ${Math.round(-4 * escala)}px;
      width: ${Math.round(12 * escala)}px;
      height: ${Math.round(12 * escala)}px;
      background: #2196f3;
      border: 2px solid white;
      border-radius: 50%;
      cursor: se-resize;
      pointer-events: auto;
      z-index: 1001;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    `;

    // Indicador de guardado
    const indicadorGuardado = document.createElement('div');
    indicadorGuardado.className = 'indicador-guardado-consolidado';
    indicadorGuardado.style.cssText = `
      display: none;
      position: absolute;
      top: ${Math.round(-8 * escala)}px;
      right: ${Math.round(-8 * escala)}px;
      background: rgba(255, 152, 0, 0.9);
      color: white;
      border-radius: 50%;
      width: ${Math.round(20 * escala)}px;
      height: ${Math.round(20 * escala)}px;
      align-items: center;
      justify-content: center;
      font-size: ${Math.round(10 * escala)}px;
      z-index: 1002;
      animation: pulse 1s infinite;
      box-shadow: 0 2px 6px rgba(255, 152, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.8);
    `;
    indicadorGuardado.textContent = '⏳';

    // Ensamblar elemento
    textoContainer.appendChild(textoContent);
    textoContainer.appendChild(resizeHandle);
    textoContainer.appendChild(indicadorGuardado);

    return textoContainer;
  }, [validarDimensiones, escala, DIMENSIONES]);

  // ===================== GESTIÓN DE EVENTOS DE TEXTO =====================
  
  /**
   * Configura todos los eventos para un elemento de texto
   */
  const configurarEventosTexto = useCallback((textoElement, texto) => {
    const textoId = texto.id.toString();
    
    // Limpiar eventos anteriores
    const eventosAnteriores = eventListenersRef.current.get(textoId);
    if (eventosAnteriores) {
      eventosAnteriores.forEach(cleanup => cleanup());
    }
    
    console.log(`🎧 Configurando eventos para texto: ${textoId}`);
    
    const cleanups = [];
    const contenido = textoElement.querySelector('.texto-contenido-consolidado');
    const resizeHandle = textoElement.querySelector('.resize-handle-consolidado');
    const indicadorGuardado = textoElement.querySelector('.indicador-guardado-consolidado');
    
    // ===== EVENTOS HOVER =====
    const handleMouseEnter = () => {
      if (!activo || operacionEnCurso) return;
      
      contenido.style.background = 'rgba(33, 150, 243, 0.05)';
      contenido.style.borderColor = 'rgba(33, 150, 243, 0.3)';
      contenido.style.borderStyle = 'dashed';
      contenido.style.boxShadow = `0 ${Math.round(2 * escala)}px ${Math.round(8 * escala)}px rgba(33, 150, 243, 0.15)`;
      
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
        
        if (resizeHandle) {
          resizeHandle.style.display = 'none';
        }
      }
    };

    // ===== DOBLE CLICK PARA EDITAR =====
    const handleDoubleClick = (e) => {
      if (!activo || operacionEnCurso) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      console.log(`🖱️ Doble click para editar texto: ${textoId}`);
      abrirModalEdicion(texto);
    };

    // ===== DRAG & DROP =====
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let dragOffset = { x: 0, y: 0 };

    const handleMouseDown = (e) => {
      if (!activo || operacionEnCurso || e.target === resizeHandle) return;
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
          textoElement.dataset.dragging = 'true';
          textoElement.style.opacity = '0.8';
          textoElement.style.zIndex = '300';
          textoElement.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))';
          
          console.log(`🎯 Drag iniciado para texto: ${textoId}`);
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
          
          console.log(`💾 Guardando nueva posición: ${textoId}`, { x: finalX.toFixed(4), y: finalY.toFixed(4) });
          
          try {
            // Mostrar indicador de guardado
            mostrarIndicadorGuardado(textoId, true);
            
            await onEditTexto({ 
              id: texto.id, 
              x: finalX, 
              y: finalY,
              texto: texto.texto,
              width: texto.width,
              height: texto.height,
              fontSize: texto.fontSize,
              pagina: texto.pagina
            });
            
            console.log(`✅ Posición guardada exitosamente: ${textoId}`);
          } catch (error) {
            console.error(`❌ Error guardando posición: ${textoId}`, error);
            mostrarError('Error guardando posición');
          } finally {
            mostrarIndicadorGuardado(textoId, false);
          }
          
          // Restaurar estilos
          textoElement.style.opacity = '1';
          textoElement.style.zIndex = '210';
          textoElement.style.filter = 'none';
          delete textoElement.dataset.dragging;
          isDragging = false;
          setOperacionEnCurso(false);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
    };

    // ===== RESIZE =====
    let isResizing = false;
    let resizeStart = { x: 0, y: 0, width: 0, height: 0 };
    
    const handleResizeStart = (e) => {
      if (!activo || operacionEnCurso) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      console.log(`📏 Iniciando resize para texto: ${textoId}`);
      
      isResizing = true;
      setOperacionEnCurso(true);
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
        
        const newWidth = Math.max(Math.round(DIMENSIONES.MIN_WIDTH * escala), resizeStart.width + deltaX);
        const newHeight = Math.max(Math.round(DIMENSIONES.MIN_HEIGHT * escala), resizeStart.height + deltaY);
        
        textoElement.style.width = `${newWidth}px`;
        textoElement.style.height = `${newHeight}px`;
      };
      
      const handleResizeEnd = async () => {
        if (isResizing) {
          const finalRect = textoElement.getBoundingClientRect();
          
          // Convertir el tamaño escalado de vuelta a tamaño base
          const baseWidth = Math.round(finalRect.width / escala);
          const baseHeight = Math.round(finalRect.height / escala);
          
          console.log(`💾 Guardando nuevo tamaño: ${textoId}`, { 
            escalado: `${finalRect.width}x${finalRect.height}`,
            base: `${baseWidth}x${baseHeight}`,
            escala: escala.toFixed(3)
          });
          
          try {
            mostrarIndicadorGuardado(textoId, true);
            
            await onEditTexto({ 
              id: texto.id, 
              x: texto.x,
              y: texto.y,
              texto: texto.texto,
              width: baseWidth,
              height: baseHeight,
              fontSize: texto.fontSize,
              pagina: texto.pagina
            });
            
            console.log(`✅ Tamaño guardado exitosamente: ${textoId}`);
          } catch (error) {
            console.error(`❌ Error guardando tamaño: ${textoId}`, error);
            mostrarError('Error guardando tamaño');
          } finally {
            mostrarIndicadorGuardado(textoId, false);
          }
          
          isResizing = false;
          delete textoElement.dataset.resizing;
          document.body.style.cursor = '';
          setOperacionEnCurso(false);
        }
        
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
      
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    };

    // Registrar todos los eventos
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

    // Guardar cleanups
    eventListenersRef.current.set(textoId, cleanups);
    
    return cleanups;
  }, [activo, operacionEnCurso, getOverlay, onEditTexto, escala, DIMENSIONES]);

  // ===================== UTILIDADES AUXILIARES =====================
  
  /**
   * Muestra/oculta indicador de guardado
   */
  const mostrarIndicadorGuardado = useCallback((textoId, mostrar) => {
    const elemento = textosElementsRef.current.get(textoId);
    if (!elemento) return;
    
    const indicador = elemento.querySelector('.indicador-guardado-consolidado');
    if (indicador) {
      indicador.style.display = mostrar ? 'flex' : 'none';
    }
    
    if (mostrar) {
      setTextoGuardando(textoId);
    } else {
      setTextoGuardando(null);
    }
  }, []);

  /**
   * Muestra error temporal
   */
  const mostrarError = useCallback((mensaje) => {
    console.error('Error:', mensaje);
    
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
      animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => errorDiv.remove(), 300);
      }
    }, 3000);
  }, []);

  // ===================== GESTIÓN DE MODALES =====================
  
  /**
   * Abre modal para crear nuevo texto
   */
  const abrirModalCreacion = useCallback((numeroPagina, x, y) => {
    if (modalConfig || operacionEnCurso) {
      console.warn('Modal ya abierto o operación en curso');
      return;
    }

    console.log('Abriendo modal de creación:', { numeroPagina, x, y });
    setOperacionEnCurso(true);
    
    setModalConfig({
      titulo: `Nuevo texto - Página ${numeroPagina}`,
      valor: '',
      fontSize: DIMENSIONES.DEFAULT_FONT_SIZE,
      width: DIMENSIONES.DEFAULT_WIDTH,
      height: DIMENSIONES.DEFAULT_HEIGHT,
      onGuardar: async (texto, fontSize, modalWidth, modalHeight) => {
        try {
          console.log('Guardando nuevo texto:', { 
            texto: texto.substring(0, 30) + '...',
            fontSize,
            modalWidth,
            modalHeight
          });

          await onAddTexto({ 
            pagina: numeroPagina, 
            x, 
            y, 
            texto, 
            width: modalWidth || DIMENSIONES.DEFAULT_WIDTH,
            height: modalHeight || DIMENSIONES.DEFAULT_HEIGHT,
            fontSize: fontSize || DIMENSIONES.DEFAULT_FONT_SIZE
          });

          console.log('Texto creado exitosamente');
          cerrarModal();
          onDesactivarHerramienta();
        } catch (error) {
          console.error('Error creando texto:', error);
          throw error;
        }
      },
      onCancelar: () => {
        console.log('Cancelando creación de texto');
        cerrarModal();
        onDesactivarHerramienta();
      }
    });
  }, [modalConfig, operacionEnCurso, onAddTexto, onDesactivarHerramienta, DIMENSIONES]);

  /**
   * Abre modal para editar texto existente
   */
  const abrirModalEdicion = useCallback((texto) => {
    if (modalConfig || operacionEnCurso) {
      console.warn('Modal ya abierto o operación en curso');
      return;
    }

    console.log('Abriendo modal de edición:', texto.id);
    setOperacionEnCurso(true);
    
    setModalConfig({
      titulo: `Editar texto - Página ${texto.pagina}`,
      valor: texto.texto,
      fontSize: texto.fontSize || DIMENSIONES.DEFAULT_FONT_SIZE,
      width: texto.width || DIMENSIONES.DEFAULT_WIDTH,
      height: texto.height || DIMENSIONES.DEFAULT_HEIGHT,
      onGuardar: async (nuevoTexto, fontSize, modalWidth, modalHeight) => {
        try {
          console.log('Guardando edición:', { 
            id: texto.id,
            nuevoTexto: nuevoTexto.substring(0, 30) + '...'
          });

          await onEditTexto({ 
            id: texto.id, 
            texto: nuevoTexto,
            x: texto.x,
            y: texto.y,
            width: modalWidth || texto.width,
            height: modalHeight || texto.height,
            pagina: texto.pagina,
            fontSize: fontSize || texto.fontSize
          });

          console.log('Texto editado exitosamente');
          cerrarModal();
          onDesactivarHerramienta();
        } catch (error) {
          console.error('Error editando texto:', error);
          throw error;
        }
      },
      onCancelar: () => {
        console.log('Cancelando edición de texto');
        cerrarModal();
      },
      onEliminar: async () => {
        try {
          console.log('Eliminando texto:', texto.id);

          await onDeleteTexto(texto.id);

          console.log('Texto eliminado exitosamente');
          cerrarModal();
          onDesactivarHerramienta();
        } catch (error) {
          console.error('Error eliminando texto:', error);
          throw error;
        }
      }
    });
  }, [modalConfig, operacionEnCurso, onEditTexto, onDeleteTexto, onDesactivarHerramienta, DIMENSIONES]);

  /**
   * Cierra modal y limpia estado
   */
  const cerrarModal = useCallback(() => {
    console.log('Cerrando modal de texto');
    setModalConfig(null);
    setOperacionEnCurso(false);
  }, []);

  // ===================== RENDERIZADO DE TEXTOS =====================
  
  /**
   * Renderiza todos los textos en el DOM
   */
  const renderizarTextos = useCallback(() => {
    console.log('🎨 Renderizando textos consolidados:', textos.length);
    
    // Limpiar elementos de textos que ya no existen
    const textosActualesIds = new Set(textos.map(t => t.id.toString()));
    
    textosElementsRef.current.forEach((elemento, textoId) => {
      if (!textosActualesIds.has(textoId)) {
        // Limpiar eventos
        const eventos = eventListenersRef.current.get(textoId);
        if (eventos) {
          eventos.forEach(cleanup => cleanup());
          eventListenersRef.current.delete(textoId);
        }
        
        // Remover del DOM
        if (elemento.parentNode) {
          elemento.remove();
        }
        textosElementsRef.current.delete(textoId);
        
        console.log(`🗑️ Texto ${textoId} eliminado del DOM`);
      }
    });

    // Renderizar textos existentes
    textos.forEach(texto => {
      const textoId = texto.id.toString();
      let elementoExistente = textosElementsRef.current.get(textoId);
      
      const overlay = getOverlay(texto.pagina);
      if (!overlay) {
        console.warn(`⚠️ No se pudo obtener overlay para texto ${textoId} en página ${texto.pagina}`);
        return;
      }
      
      if (!elementoExistente || !elementoExistente.parentNode) {
        // Crear nuevo elemento
        elementoExistente = crearElementoTexto(texto);
        overlay.appendChild(elementoExistente);
        textosElementsRef.current.set(textoId, elementoExistente);
        
        // Configurar eventos (solo una vez)
        configurarEventosTexto(elementoExistente, texto);
        
        console.log(`✅ Texto ${textoId} creado en página ${texto.pagina}`);
      } else {
        // Actualizar elemento existente
        const dimensiones = validarDimensiones(texto.width, texto.height, texto.fontSize);
        
        // Actualizar posición y dimensiones
        elementoExistente.style.left = `${texto.x * 100}%`;
        elementoExistente.style.top = `${texto.y * 100}%`;
        elementoExistente.style.width = `${dimensiones.scaledWidth}px`;
        elementoExistente.style.height = `${dimensiones.scaledHeight}px`;
        
        // Actualizar contenido
        const contenido = elementoExistente.querySelector('.texto-contenido-consolidado');
        if (contenido) {
          contenido.textContent = texto.texto;
          contenido.style.fontSize = `${dimensiones.scaledFontSize}px`;
          contenido.style.padding = `${Math.round(8 * escala)}px ${Math.round(12 * escala)}px`;
        }
        
        // Actualizar handle de resize
        const resizeHandle = elementoExistente.querySelector('.resize-handle-consolidado');
        if (resizeHandle) {
          resizeHandle.style.width = `${Math.round(12 * escala)}px`;
          resizeHandle.style.height = `${Math.round(12 * escala)}px`;
          resizeHandle.style.bottom = `${Math.round(-4 * escala)}px`;
          resizeHandle.style.right = `${Math.round(-4 * escala)}px`;
        }
        
        console.log(`🔄 Texto ${textoId} actualizado`);
      }
    });
  }, [textos, getOverlay, crearElementoTexto, configurarEventosTexto, validarDimensiones, escala]);

  // ===================== MANEJO DE CLICKS EN OVERLAY =====================
  
  /**
   * Maneja clicks en overlay para crear nuevo texto
   */
  const handleOverlayClick = useCallback((numeroPagina, overlay) => {
    return (e) => {
      if (!activo || operacionEnCurso || modalConfig) return;
      
      // Evitar clicks en textos existentes
      if (e.target.closest('.texto-consolidado')) {
        return;
      }
      
      const coords = convertirARelativas(e, overlay);
      if (!coords) {
        console.warn('⚠️ No se pudieron calcular coordenadas relativas');
        return;
      }
      
      console.log('🖱️ Click para crear texto:', { numeroPagina, coords });
      abrirModalCreacion(numeroPagina, coords.x, coords.y);
    };
  }, [activo, operacionEnCurso, modalConfig, convertirARelativas, abrirModalCreacion]);

  /**
   * Configura eventos de overlay para todas las páginas
   */
  const configurarEventosOverlay = useCallback(() => {
    if (!activo) return;
    
    const paginas = document.querySelectorAll('.rpv-core__inner-page[aria-label^="Page "]');
    
    console.log(`🎧 Configurando eventos de overlay para ${paginas.length} páginas`);
    
    paginas.forEach((paginaElement) => {
      const ariaLabel = paginaElement.getAttribute('aria-label');
      const numeroPagina = parseInt(ariaLabel.replace('Page ', ''));
      
      if (isNaN(numeroPagina)) {
        console.warn('⚠️ No se pudo extraer número de página de:', ariaLabel);
        return;
      }
      
      const overlay = getOverlay(numeroPagina);
      
      if (overlay) {
        // Limpiar evento anterior
        const eventoAnterior = overlay._clickHandler;
        if (eventoAnterior) {
          overlay.removeEventListener('mousedown', eventoAnterior);
        }
        
        // Agregar nuevo evento
        const clickHandler = handleOverlayClick(numeroPagina, overlay);
        overlay.addEventListener('mousedown', clickHandler, { passive: false });
        overlay._clickHandler = clickHandler;
        
        console.log(`✅ Eventos configurados para página ${numeroPagina}`);
      }
    });
  }, [activo, getOverlay, handleOverlayClick]);

  // ===================== EFECTOS PRINCIPALES =====================

  // Renderizar textos cuando cambien los datos o la escala
  useEffect(() => {
    if (visorInfo?.mode === 'single') {
      renderizarTextos();
    }
  }, [textos, escala, visorInfo?.mode, renderizarTextos]);

  // Configurar eventos cuando esté activo
  useEffect(() => {
    if (visorInfo?.mode === 'single' && activo) {
      // Pequeño delay para asegurar que las páginas estén disponibles
      const timer = setTimeout(() => {
        configurarEventosOverlay();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activo, visorInfo?.mode, configurarEventosOverlay]);

  // Limpiar al desactivar
  useEffect(() => {
    if (!activo) {
      setModalConfig(null);
      setOperacionEnCurso(false);
      setTextoGuardando(null);
    }
  }, [activo]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 TextosLayer: Iniciando cleanup completo');
      
      // Limpiar todos los event listeners
      eventListenersRef.current.forEach(cleanups => {
        cleanups.forEach(cleanup => cleanup());
      });
      eventListenersRef.current.clear();
      
      // Limpiar overlays
      overlaysRef.current.forEach(overlay => {
        if (overlay.parentNode) {
          overlay.remove();
        }
      });
      overlaysRef.current.clear();
      
      // Limpiar elementos de texto
      textosElementsRef.current.clear();
      
      console.log('✅ TextosLayer: Cleanup completo');
    };
  }, []);

  // Solo modo single soportado por ahora
  if (visorInfo?.mode !== 'single') {
    return null;
  }

  // ===================== RENDER =====================

  return (
    <>
      {/* Modal unificado */}
      {modalConfig && (
        <TextoModal
          isOpen={true}
          titulo={modalConfig.titulo}
          valor={modalConfig.valor || ''}
          fontSize={modalConfig.fontSize || DIMENSIONES.DEFAULT_FONT_SIZE}
          width={modalConfig.width || DIMENSIONES.DEFAULT_WIDTH}
          height={modalConfig.height || DIMENSIONES.DEFAULT_HEIGHT}
          currentPDFScale={escala}
          onGuardar={modalConfig.onGuardar}
          onCancelar={modalConfig.onCancelar}
          onEliminar={modalConfig.onEliminar}
          showBackendStatus={true}
        />
      )}

      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 9999,
            display: activo ? 'block' : 'none'
          }}
        >
          TextosLayer v2 | Activo: {activo ? '✅' : '❌'} | 
          Textos: {textos.length} | 
          DOM: {textosElementsRef.current.size} | 
          Overlays: {overlaysRef.current.size} | 
          Escala: {escala.toFixed(2)} | 
          Modal: {modalConfig ? '📝' : '❌'} | 
          Guardando: {textoGuardando || '❌'}
        </div>
      )}

      {/* Container invisible para debugging React */}
      <div 
        style={{ display: 'none' }}
        data-active={activo}
        data-pagina-actual={paginaActual}
        data-elementos={textos.length}
        data-elementos-dom={textosElementsRef.current.size}
        data-overlays={overlaysRef.current.size}
        data-modal-abierto={!!modalConfig}
        data-operacion-en-curso={operacionEnCurso}
        data-texto-guardando={textoGuardando}
        data-escala={escala.toFixed(2)}
        data-version="consolidado-v2"
        data-sistema="sin-dependencias-externas"
      />

      {/* CSS para animaciones */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
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
      `}</style>
    </>
  );
};

export default TextosLayer;
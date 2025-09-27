// src/Componentes/Lector/anotaciones/TextoAnotacion.jsx - VERSIÓN CORREGIDA SIN ROMPER TOUCH
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './modalEdicion.css';

/**
 * Componente individual para anotaciones de texto con fuente Caveat y transparencia
 * SIN ROMPER EL SOPORTE TÁCTIL DEL SISTEMA
 */
const TextoAnotacion = ({
  anotacion,
  seleccionada,
  editando,
  zoom,
  esDispositiveMovil = false,
  puedeArrastrar = false,
  onGuardar,
  onEliminar,
  onIniciarEdicion
}) => {
  
  // Estados principales
  const [modoEdicion, setModoEdicion] = useState(anotacion.metadatos?.esNueva || false);
  const [mostrarModal, setMostrarModal] = useState(anotacion.metadatos?.esNueva || false);
  const [textoLocal, setTextoLocal] = useState(anotacion.contenido.texto);
  const [fontSizeLocal, setFontSizeLocal] = useState(anotacion.contenido.fontSize || 14);
  const [colorLocal, setColorLocal] = useState(anotacion.contenido.color || '#000000');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados de redimensionamiento
  const [redimensionando, setRedimensionando] = useState(false);
  const [tipoRedimension, setTipoRedimension] = useState(null);
  const [dimensionesIniciales, setDimensionesIniciales] = useState(null);
  const [posicionInicialMouse, setPosicionInicialMouse] = useState(null);
  
  const modalTextareaRef = useRef(null);
  const contenedorRef = useRef(null);
  const [ultimoClic, setUltimoClic] = useState(0);
  const [timerToque, setTimerToque] = useState(null);

  /**
   * Determinar el peso de fuente según el tamaño
   */
  const obtenerPesoFuente = useCallback((fontSize) => {
    if (fontSize <= 12) return 400;
    if (fontSize <= 18) return 500;
    if (fontSize <= 24) return 600;
    return 700;
  }, []);

  /**
   * Determinar si la anotación debe ser transparente (ya guardada)
   */
  const esAnotacionGuardada = useCallback(() => {
    return !anotacion.metadatos?.esNueva && !modoEdicion && !mostrarModal;
  }, [anotacion.metadatos?.esNueva, modoEdicion, mostrarModal]);

  /**
   * CORREGIDO: Maneja eventos de toque SOLO en la anotación, no interfiere con el scroll del visor
   */
  const manejarTouchStart = useCallback((event) => {
    if (!esDispositiveMovil) return;

    // IMPORTANTE: Solo prevenir comportamiento por defecto si es específicamente en redimensión
    if (redimensionando || mostrarModal) {
      event.stopPropagation();
      return;
    }

    if (modoEdicion && anotacion.metadatos?.esNueva) {
      return;
    }

    // NO PREVENIR event.preventDefault() aquí para mantener scroll/zoom del sistema
    if (timerToque) {
      clearTimeout(timerToque);
    }

    const nuevoTimer = setTimeout(() => {
      setMostrarModal(true);
      onIniciarEdicion?.();
    }, 800);

    setTimerToque(nuevoTimer);
  }, [esDispositiveMovil, redimensionando, mostrarModal, modoEdicion, anotacion.metadatos?.esNueva, timerToque, onIniciarEdicion]);

  /**
   * Maneja cuando termina el toque
   */
  const manejarTouchEnd = useCallback((event) => {
    if (!esDispositiveMovil) return;

    if (timerToque) {
      clearTimeout(timerToque);
      setTimerToque(null);
    }
  }, [esDispositiveMovil, timerToque]);

  /**
   * Maneja clics en dispositivos no móviles
   */
  const manejarClick = useCallback((event) => {
    if (esDispositiveMovil) return;
    
    event.stopPropagation();
    
    if (redimensionando) return;
    
    if (modoEdicion && anotacion.metadatos?.esNueva) {
      return;
    }
    
    const ahora = Date.now();
    const tiempoEntreclics = ahora - ultimoClic;
    
    if (tiempoEntreclics < 350 && tiempoEntreclics > 50) {
      setMostrarModal(true);
      onIniciarEdicion?.();
    }
    
    setUltimoClic(ahora);
  }, [esDispositiveMovil, ultimoClic, modoEdicion, anotacion.metadatos?.esNueva, onIniciarEdicion, redimensionando]);

  /**
   * Controla cuando se puede arrastrar
   */
  const manejarMouseDown = useCallback((event) => {
    if (esDispositiveMovil) return;

    if (redimensionando || mostrarModal || (anotacion.metadatos?.esNueva && mostrarModal)) {
      event.stopPropagation();
    }
  }, [esDispositiveMovil, redimensionando, mostrarModal, anotacion.metadatos?.esNueva]);

  /**
   * Obtiene coordenadas de evento (mouse o táctil)
   */
  const obtenerCoordenadas = useCallback((event) => {
    if (event.touches && event.touches.length > 0) {
      return {
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY
      };
    }
    return {
      clientX: event.clientX,
      clientY: event.clientY
    };
  }, []);

  /**
   * CORREGIDO: Inicia el redimensionamiento SOLO cuando es necesario
   */
  const iniciarRedimension = useCallback((event, tipo) => {
    // IMPORTANTE: Solo aquí prevenir el comportamiento por defecto
    event.stopPropagation();
    event.preventDefault();
    
    const rect = contenedorRef.current.getBoundingClientRect();
    const coords = obtenerCoordenadas(event);
    
    setRedimensionando(true);
    setTipoRedimension(tipo);
    setDimensionesIniciales({
      ancho: rect.width,
      alto: rect.height
    });
    setPosicionInicialMouse({
      x: coords.clientX,
      y: coords.clientY
    });
  }, [obtenerCoordenadas]);

  /**
   * Maneja el movimiento durante redimensionamiento
   */
  const manejarMovimientoRedimension = useCallback((event) => {
    if (!redimensionando || !tipoRedimension || !dimensionesIniciales || !posicionInicialMouse) {
      return;
    }

    event.preventDefault();
    
    const coords = obtenerCoordenadas(event);
    const deltaX = coords.clientX - posicionInicialMouse.x;
    const deltaY = coords.clientY - posicionInicialMouse.y;
    
    let nuevoAncho = dimensionesIniciales.ancho;
    let nuevoAlto = dimensionesIniciales.alto;
    
    switch (tipoRedimension) {
      case 'se':
        nuevoAncho = Math.max(100, dimensionesIniciales.ancho + deltaX);
        nuevoAlto = Math.max(40, dimensionesIniciales.alto + deltaY);
        break;
      case 'e':
        nuevoAncho = Math.max(100, dimensionesIniciales.ancho + deltaX);
        break;
      case 's':
        nuevoAlto = Math.max(40, dimensionesIniciales.alto + deltaY);
        break;
    }
    
    if (contenedorRef.current) {
      contenedorRef.current.style.width = `${nuevoAncho}px`;
      contenedorRef.current.style.height = `${nuevoAlto}px`;
    }
  }, [redimensionando, tipoRedimension, dimensionesIniciales, posicionInicialMouse, obtenerCoordenadas]);

  /**
   * Finaliza el redimensionamiento
   */
  const finalizarRedimension = useCallback(async () => {
    if (!redimensionando || !contenedorRef.current) return;
    
    const rect = contenedorRef.current.getBoundingClientRect();
    const capaAnotaciones = contenedorRef.current.closest('.capa-anotaciones');
    if (!capaAnotaciones) return;
    
    const rectCapa = capaAnotaciones.getBoundingClientRect();
    const anchoRelativo = rect.width / rectCapa.width;
    const altoRelativo = rect.height / rectCapa.height;
    
    try {
      const anotacionActualizada = {
        ...anotacion,
        dimensiones: {
          ancho: anchoRelativo,
          alto: altoRelativo
        },
        metadatos: {
          ...anotacion.metadatos,
          modificado: new Date().toISOString()
        }
      };
      
      await onGuardar?.(anotacionActualizada);
    } catch (error) {
      // Error manejado por el padre
    }
    
    setRedimensionando(false);
    setTipoRedimension(null);
    setDimensionesIniciales(null);
    setPosicionInicialMouse(null);
  }, [redimensionando, anotacion, onGuardar]);

  /**
   * Event listeners para redimensionamiento global
   */
  useEffect(() => {
    if (redimensionando) {
      const manejarMovimiento = (e) => {
        e.preventDefault();
        manejarMovimientoRedimension(e);
      };
      
      const manejarFin = (e) => {
        e.preventDefault();
        finalizarRedimension();
      };
      
      if (esDispositiveMovil) {
        document.addEventListener('touchmove', manejarMovimiento, { passive: false });
        document.addEventListener('touchend', manejarFin, { passive: false });
        document.addEventListener('touchcancel', manejarFin, { passive: false });
      } else {
        document.addEventListener('mousemove', manejarMovimiento, { passive: false });
        document.addEventListener('mouseup', manejarFin, { passive: false });
      }
      
      document.body.style.cursor = 'nw-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        if (esDispositiveMovil) {
          document.removeEventListener('touchmove', manejarMovimiento);
          document.removeEventListener('touchend', manejarFin);
          document.removeEventListener('touchcancel', manejarFin);
        } else {
          document.removeEventListener('mousemove', manejarMovimiento);
          document.removeEventListener('mouseup', manejarFin);
        }
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [redimensionando, manejarMovimientoRedimension, finalizarRedimension, esDispositiveMovil]);

  /**
   * Limpiar timer al desmontar
   */
  useEffect(() => {
    return () => {
      if (timerToque) {
        clearTimeout(timerToque);
      }
    };
  }, [timerToque]);

  /**
   * Guarda la anotación
   */
  const guardarCambios = useCallback(async () => {
    if (!textoLocal.trim()) {
      setError('El texto no puede estar vacío');
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      const anotacionActualizada = {
        ...anotacion,
        contenido: {
          ...anotacion.contenido,
          texto: textoLocal.trim(),
          fontSize: fontSizeLocal,
          color: colorLocal
        },
        metadatos: {
          ...anotacion.metadatos,
          modificado: new Date().toISOString(),
          editando: false,
          esNueva: false
        }
      };

      await onGuardar?.(anotacionActualizada);
      
      setMostrarModal(false);
      setModoEdicion(true);
      
    } catch (err) {
      setError('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }, [textoLocal, fontSizeLocal, colorLocal, anotacion, onGuardar]);

  /**
   * Cancela la edición
   */
  const cancelarEdicion = useCallback(() => {
    if (anotacion.metadatos?.esNueva) {
      onEliminar?.();
      return;
    }

    setTextoLocal(anotacion.contenido.texto);
    setFontSizeLocal(anotacion.contenido.fontSize || 14);
    setColorLocal(anotacion.contenido.color || '#000000');
    setMostrarModal(false);
    setError(null);
  }, [anotacion, onEliminar]);

  /**
   * Elimina la anotación
   */
  const eliminarAnotacion = useCallback(() => {
    const mensaje = esDispositiveMovil 
      ? '¿Eliminar esta anotación?' 
      : '¿Estás seguro de que deseas eliminar esta anotación?';
      
    if (window.confirm(mensaje)) {
      onEliminar?.();
    }
  }, [onEliminar, esDispositiveMovil]);

  /**
   * Maneja teclas del modal
   */
  const manejarTeclas = useCallback((event) => {
    if (!mostrarModal) return;
    
    switch (event.key) {
      case 'Enter':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          guardarCambios();
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        cancelarEdicion();
        break;
        
      default:
        break;
    }
  }, [mostrarModal, guardarCambios, cancelarEdicion]);

  /**
   * Auto-focus en modal
   */
  useEffect(() => {
    if (mostrarModal && modalTextareaRef.current) {
      setTimeout(() => {
        modalTextareaRef.current?.focus();
        modalTextareaRef.current?.select();
      }, 100);
    }
  }, [mostrarModal]);

  /**
   * Event listeners
   */
  useEffect(() => {
    if (mostrarModal) {
      document.addEventListener('keydown', manejarTeclas);
      return () => document.removeEventListener('keydown', manejarTeclas);
    }
  }, [mostrarModal, manejarTeclas]);

  /**
   * ESTILOS CORREGIDOS: Con fuente Caveat y transparencia
   */
  const fontSizeEscalado = Math.max(10, fontSizeLocal * zoom);
  const pesoFuente = obtenerPesoFuente(fontSizeLocal);
  const anotacionGuardada = esAnotacionGuardada();

  const estilosAnotacion = {
    fontSize: `${fontSizeEscalado}px`,
    color: colorLocal,
    lineHeight: '1.3',
    letterSpacing: '0.5px',
    wordWrap: 'break-word',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    padding: '4px 6px',
    pointerEvents: redimensionando ? 'none' : 'auto',
    // Aplicar fuente Caveat
    fontFamily: '"Caveat", cursive',
    fontOpticalSizing: 'auto',
    fontWeight: pesoFuente,
    fontStyle: 'normal'
  };

  const yaGuardada = !anotacion.metadatos?.esNueva;
  const enModoEdicion = modoEdicion && yaGuardada;
  
  // CORREGIDO: Estilos del contenedor SIN romper touch
  const estilosContenedor = {
    width: '100%',
    height: '100%',
    border: modoEdicion 
      ? '2px dashed #de007e' 
      : seleccionada 
        ? (anotacionGuardada ? '1px solid rgba(222, 0, 126, 0.3)' : '2px solid #de007e')
        : (anotacionGuardada ? '1px solid transparent' : '1px solid rgba(0,0,0,0.1)'),
    borderRadius: '4px',
    backgroundColor: anotacionGuardada 
      ? 'transparent' // TRANSPARENTE cuando está guardada
      : enModoEdicion 
        ? 'rgba(255, 255, 255, 0.1)'
        : anotacion.metadatos?.esNueva
          ? 'rgba(222, 0, 126, 0.1)'
          : 'rgba(255, 255, 255, 0.9)',
    boxShadow: anotacionGuardada
      ? (seleccionada ? '0 1px 6px rgba(222, 0, 126, 0.1)' : 'none')
      : (seleccionada || modoEdicion)
        ? '0 2px 8px rgba(222, 0, 126, 0.3)'
        : '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: redimensionando ? 'none' : 'all 0.2s ease',
    cursor: redimensionando ? 'nw-resize' : puedeArrastrar ? 'move' : 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    userSelect: redimensionando ? 'none' : 'auto',
    // CORREGIDO: NO interferir con touch del sistema
    touchAction: redimensionando ? 'none' : 'auto'
  };

  // Estilos para handles
  const estiloHandleBase = {
    position: 'absolute',
    backgroundColor: '#de007e',
    border: '1px solid white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    zIndex: 10
  };

  const tamanoHandle = esDispositiveMovil ? {
    principal: { width: '14px', height: '14px' },
    secundario: { width: '12px', height: '24px' }
  } : {
    principal: { width: '10px', height: '10px' },
    secundario: { width: '8px', height: '20px' }
  };

  // CORREGIDO: Eventos que NO interfieren con el sistema
  const eventosContenedor = {
    ...(esDispositiveMovil ? {
      onTouchStart: manejarTouchStart,
      onTouchEnd: manejarTouchEnd
    } : {
      onClick: manejarClick,
      onMouseDown: manejarMouseDown
    })
  };

  return (
    <>
      <div
        ref={contenedorRef}
        className={`anotacion-texto ${seleccionada ? 'seleccionada' : ''} ${modoEdicion ? 'editando' : ''} ${anotacionGuardada ? 'guardada' : ''} ${redimensionando ? 'redimensionando' : ''} ${esDispositiveMovil ? 'movil' : 'desktop'}`}
        style={estilosContenedor}
        {...eventosContenedor}
      >
        {/* Contenido del texto con fuente Caveat */}
        <div className="contenido-texto contenido-texto-caveat" style={estilosAnotacion}>
          {textoLocal}
        </div>

        {/* Handles de redimensionamiento - SOLO en modo edición */}
        {enModoEdicion && (
          <>
            <div
              className="resize-handle resize-se"
              onMouseDown={!esDispositiveMovil ? (e) => iniciarRedimension(e, 'se') : undefined}
              onTouchStart={esDispositiveMovil ? (e) => iniciarRedimension(e, 'se') : undefined}
              style={{
                ...estiloHandleBase,
                bottom: '-6px',
                right: '-6px',
                ...tamanoHandle.principal,
                cursor: 'nw-resize',
                borderRadius: '50%'
              }}
              title="Redimensionar"
            />
            
            {(!esDispositiveMovil || window.innerWidth > 600) && (
              <>
                <div
                  className="resize-handle resize-e"
                  onMouseDown={!esDispositiveMovil ? (e) => iniciarRedimension(e, 'e') : undefined}
                  onTouchStart={esDispositiveMovil ? (e) => iniciarRedimension(e, 'e') : undefined}
                  style={{
                    ...estiloHandleBase,
                    top: '50%',
                    right: '-4px',
                    width: tamanoHandle.secundario.width,
                    height: tamanoHandle.secundario.height,
                    cursor: 'ew-resize',
                    borderRadius: '4px',
                    transform: 'translateY(-50%)'
                  }}
                  title="Redimensionar ancho"
                />
                
                <div
                  className="resize-handle resize-s"
                  onMouseDown={!esDispositiveMovil ? (e) => iniciarRedimension(e, 's') : undefined}
                  onTouchStart={esDispositiveMovil ? (e) => iniciarRedimension(e, 's') : undefined}
                  style={{
                    ...estiloHandleBase,
                    bottom: '-4px',
                    left: '50%',
                    width: tamanoHandle.secundario.height,
                    height: tamanoHandle.secundario.width,
                    cursor: 'ns-resize',
                    borderRadius: '4px',
                    transform: 'translateX(-50%)'
                  }}
                  title="Redimensionar alto"
                />
              </>
            )}
          </>
        )}

        {/* Indicadores visuales */}
        {enModoEdicion && (
          <div style={{
            position: 'absolute',
            top: '-30px',
            left: '0',
            fontSize: esDispositiveMovil ? '10px' : '11px',
            color: '#de007e',
            backgroundColor: 'rgba(255,255,255,0.95)',
            padding: '4px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            border: '1px solid #de007e',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            maxWidth: esDispositiveMovil ? '120px' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {esDispositiveMovil 
              ? 'Mantén presionado para mover' 
              : 'Arrastra para mover'
            }
          </div>
        )}

        {seleccionada && anotacionGuardada && (
          <div style={{
            position: 'absolute',
            bottom: '-25px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap'
          }}>
            {esDispositiveMovil ? 'Mantén presionado para opciones' : 'Doble clic para opciones'}
          </div>
        )}

        {seleccionada && !modoEdicion && !anotacionGuardada && (
          <div style={{
            position: 'absolute',
            bottom: '-25px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap'
          }}>
            {esDispositiveMovil ? 'Mantén presionado para opciones' : 'Doble clic para opciones'}
          </div>
        )}
      </div>

      {/* Modal de edición con fuente Caveat */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={cancelarEdicion}>
          <div className="modal-edicion" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-titulo">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479z"/>
                </svg>
                {anotacion.metadatos?.esNueva ? 'Agregar Texto' : 'Editar Texto'}
              </h3>
              <button onClick={cancelarEdicion} className="modal-cerrar" title="Cerrar modal (Esc)">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                </svg>
              </button>
            </div>

            <div className="modal-contenido">
              <div className="textarea-container">
                <label htmlFor="texto-modal">Texto:</label>
                <textarea
                  id="texto-modal"
                  ref={modalTextareaRef}
                  value={textoLocal}
                  onChange={(e) => setTextoLocal(e.target.value)}
                  className="textarea-modal"
                  style={{
                    fontFamily: '"Caveat", cursive',
                    fontOpticalSizing: 'auto',
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '18px',
                    letterSpacing: '0.5px',
                    lineHeight: '1.4'
                  }}
                  placeholder="Escribe el contenido de tu anotación..."
                  rows={4}
                />
              </div>

              <div className="controles-formato">
                <div className="control-item">
                  <label htmlFor="font-size">Tamaño:</label>
                  <div className="input-with-unit">
                    <input
                      id="font-size"
                      type="range"
                      min="8"
                      max="72"
                      value={fontSizeLocal}
                      onChange={(e) => setFontSizeLocal(parseInt(e.target.value))}
                      className="range-input"
                    />
                    <span className="unit-display">{fontSizeLocal}px</span>
                  </div>
                </div>

                <div className="control-item">
                  <label htmlFor="color">Color:</label>
                  <div className="color-picker-container">
                    <input
                      id="color"
                      type="color"
                      value={colorLocal}
                      onChange={(e) => setColorLocal(e.target.value)}
                      className="color-input-modal"
                    />
                    <span className="color-value">{colorLocal}</span>
                  </div>
                </div>
              </div>

              <div className="vista-previa">
                <label>Vista previa:</label>
                <div 
                  className="preview-text"
                  style={{
                    fontSize: `${fontSizeLocal}px`,
                    color: colorLocal,
                    fontFamily: '"Caveat", cursive',
                    fontOpticalSizing: 'auto',
                    fontWeight: obtenerPesoFuente(fontSizeLocal),
                    fontStyle: 'normal',
                    letterSpacing: '0.5px',
                    lineHeight: '1.3'
                  }}
                >
                  {textoLocal || 'Vista previa del texto...'}
                </div>
              </div>

              {error && (
                <div className="mensaje-error-modal">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                  </svg>
                  {error}
                </div>
              )}
            </div>

            <div className="modal-footer">
              {!esDispositiveMovil && (
                <div className="atajos-hint">
                  Ctrl+Enter para guardar • Esc para cancelar
                </div>
              )}
              <div className="botones-modal">
                {!anotacion.metadatos?.esNueva && (
                  <button
                    onClick={eliminarAnotacion}
                    className="btn-modal"
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      marginRight: 'auto'
                    }}
                    disabled={guardando}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84L13.962 3.5H14.5a.5.5 0 0 0 0-1h-1.004a.58.58 0 0 0-.01 0H11Z"/>
                    </svg>
                    Eliminar
                  </button>
                )}
                
                <button
                  onClick={cancelarEdicion}
                  className="btn-modal btn-cancelar-modal"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                
                <button
                  onClick={guardarCambios}
                  className="btn-modal btn-guardar-modal"
                  disabled={guardando || !textoLocal.trim()}
                >
                  {guardando ? (
                    <>
                      <div className="spinner-btn"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1z"/>
                      </svg>
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TextoAnotacion;
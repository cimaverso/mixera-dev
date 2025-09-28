// src/Componentes/Lector/CapaAnotaciones.jsx - FIX DEFINITIVO PARA ARRASTRE MÓVIL
import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import TextoAnotacion from './anotaciones/TextoAnotacion';

const CapaAnotaciones = forwardRef(({
  anotaciones,
  anotacionSeleccionada,
  herramientaActiva,
  zoom,
  dimensionesPDF,
  onCrearAnotacion,
  onSeleccionarAnotacion,
  onGuardarAnotacion,
  onEliminarAnotacion
}, ref) => {

  const capaRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [posicionArrastre, setPosicionArrastre] = useState({ x: 0, y: 0 });
  const [anotacionArrastrada, setAnotacionArrastrada] = useState(null);
  const [offsetArrastre, setOffsetArrastre] = useState({ x: 0, y: 0 });
  const [esDispositiveMovil, setEsDispositiveMovil] = useState(false);
  
  // NUEVO: Guardar dimensiones de la anotación al iniciar arrastre
  const [dimensionesAnotacionArrastrada, setDimensionesAnotacionArrastrada] = useState(null);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const detectarMovil = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             ('ontouchstart' in window) ||
             (window.innerWidth <= 768);
    };
    
    setEsDispositiveMovil(detectarMovil());
    
    const manejarResize = () => {
      setEsDispositiveMovil(detectarMovil());
    };
    
    window.addEventListener('resize', manejarResize);
    return () => window.removeEventListener('resize', manejarResize);
  }, []);

  /**
   * Convierte coordenadas relativas (0-1) a píxeles según zoom actual
   */
  const convertirAPixeles = useCallback((coordenadasRelativas) => {
    if (!dimensionesPDF.ancho || !dimensionesPDF.alto) {
      return { x: 0, y: 0 };
    }
    
    return {
      x: coordenadasRelativas.x * dimensionesPDF.ancho * zoom,
      y: coordenadasRelativas.y * dimensionesPDF.alto * zoom
    };
  }, [dimensionesPDF, zoom]);

  /**
   * Convierte coordenadas de píxeles a relativas (0-1)
   */
  const convertirARelativo = useCallback((coordenadasPixeles) => {
    if (!dimensionesPDF.ancho || !dimensionesPDF.alto) {
      return { x: 0, y: 0 };
    }
    
    const x = Math.max(0, Math.min(1, coordenadasPixeles.x / (dimensionesPDF.ancho * zoom)));
    const y = Math.max(0, Math.min(1, coordenadasPixeles.y / (dimensionesPDF.alto * zoom)));
    
    return { x, y };
  }, [dimensionesPDF, zoom]);

  /**
   * FIX PRINCIPAL: Obtiene coordenadas considerando scroll para móvil
   */
  const obtenerCoordenadasConScroll = useCallback((event, rect) => {
    let clientX, clientY;
    
    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // FIX MÓVIL: Considerar scroll
    if (esDispositiveMovil) {
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      
      return {
        x: clientX + scrollX - rect.left,
        y: clientY + scrollY - rect.top
      };
    }
    
    // Desktop: comportamiento original
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, [esDispositiveMovil]);

  /**
   * FIX SECUNDARIO: Obtiene coordenadas SIN scroll (para cálculo de offset consistente)
   */
  const obtenerCoordenadasSinScroll = useCallback((event, rect) => {
    let clientX, clientY;
    
    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // SIEMPRE sin scroll para offset consistente
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  /**
   * Obtiene coordenadas simples (para compatibilidad)
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
   * Maneja el clic/toque en la capa SOLO para crear anotaciones
   */
  const manejarClickCapa = useCallback((event) => {
    if (herramientaActiva !== 'texto') return;
    if (event.target.closest('.anotacion-texto, .controles-seleccion, .controles-inline, .modal-overlay')) return;

    const rect = capaRef.current.getBoundingClientRect();
    const coords = obtenerCoordenadasConScroll(event, rect);

    const limitesX = dimensionesPDF.ancho * zoom;
    const limitesY = dimensionesPDF.alto * zoom;

    if (coords.x >= 0 && coords.x <= limitesX && coords.y >= 0 && coords.y <= limitesY) {
      onCrearAnotacion?.({ x: coords.x, y: coords.y });
    }
  }, [herramientaActiva, dimensionesPDF, zoom, onCrearAnotacion, obtenerCoordenadasConScroll]);

  /**
   * Determina si una anotación puede ser arrastrada
   */
  const puedeArrastrar = useCallback((anotacion) => {
    if (esDispositiveMovil) {
      const anotacionCompleta = anotaciones.find(a => a.id === anotacion.id);
      const enModoEdicion = anotacionCompleta && !anotacionCompleta.metadatos?.esNueva;
      return herramientaActiva === 'cursor' || enModoEdicion;
    }
    
    return herramientaActiva === 'cursor';
  }, [esDispositiveMovil, herramientaActiva, anotaciones]);

  /**
   * CORREGIDO: Inicia el arrastre con cálculo de offset consistente
   */
  const iniciarArrastre = useCallback((anotacionId, event) => {
    const anotacion = anotaciones.find(a => a.id === anotacionId);
    if (!anotacion || !puedeArrastrar(anotacion)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    
    const rect = capaRef.current.getBoundingClientRect();
    
    // FIX CRÍTICO: Usar coordenadas SIN scroll para offset (consistente con posición de anotación)
    const coords = obtenerCoordenadasSinScroll(event, rect);
    const posicionAnotacion = convertirAPixeles(anotacion.posicion);
    
    const offsetX = coords.x - posicionAnotacion.x;
    const offsetY = coords.y - posicionAnotacion.y;
    
    // NUEVO: Guardar dimensiones de la anotación al iniciar
    const dimensiones = {
      ancho: anotacion.dimensiones.ancho * dimensionesPDF.ancho * zoom,
      alto: anotacion.dimensiones.alto * dimensionesPDF.alto * zoom
    };
    
    setArrastrando(true);
    setAnotacionArrastrada(anotacionId);
    setOffsetArrastre({ x: offsetX, y: offsetY });
    setDimensionesAnotacionArrastrada(dimensiones);
    
    // FIX: Posición inicial usando coordenadas CON scroll para posicionamiento correcto
    const coordsConScroll = obtenerCoordenadasConScroll(event, rect);
    setPosicionArrastre({
      x: coordsConScroll.x - offsetX,
      y: coordsConScroll.y - offsetY
    });

    onSeleccionarAnotacion?.(anotacionId);
    
    console.log(`Iniciando arrastre - Offset: ${offsetX}, ${offsetY} | Posición inicial: ${coordsConScroll.x - offsetX}, ${coordsConScroll.y - offsetY}`);
  }, [anotaciones, puedeArrastrar, onSeleccionarAnotacion, convertirAPixeles, obtenerCoordenadasSinScroll, obtenerCoordenadasConScroll, dimensionesPDF, zoom]);

  /**
   * CORREGIDO: Maneja el movimiento durante el arrastre
   */
  const manejarMovimiento = useCallback((event) => {
    if (!arrastrando || !anotacionArrastrada || !dimensionesAnotacionArrastrada) return;

    event.preventDefault();
    
    const rect = capaRef.current.getBoundingClientRect();
    
    // FIX: Usar coordenadas CON scroll para movimiento
    const coords = obtenerCoordenadasConScroll(event, rect);
    
    const nuevaX = coords.x - offsetArrastre.x;
    const nuevaY = coords.y - offsetArrastre.y;

    // CORREGIDO: Usar dimensiones fijas guardadas al iniciar arrastre
    const anchoAnotacion = dimensionesAnotacionArrastrada.ancho;
    const altoAnotacion = dimensionesAnotacionArrastrada.alto;
    
    // Límites del PDF
    const limitesX = dimensionesPDF.ancho * zoom;
    const limitesY = dimensionesPDF.alto * zoom;

    // CORREGIDO: Usar las dimensiones fijas
    const xLimitada = Math.max(0, Math.min(nuevaX, limitesX - anchoAnotacion));
    const yLimitada = Math.max(0, Math.min(nuevaY, limitesY - altoAnotacion));

    setPosicionArrastre({ x: xLimitada, y: yLimitada });
  }, [arrastrando, anotacionArrastrada, dimensionesPDF, zoom, offsetArrastre, obtenerCoordenadasConScroll, dimensionesAnotacionArrastrada]);

  /**
   * Finaliza el arrastre y actualiza la posición de la anotación
   */
  const finalizarArrastre = useCallback(() => {
    if (!arrastrando || !anotacionArrastrada) return;

    const anotacion = anotaciones.find(a => a.id === anotacionArrastrada);
    if (anotacion) {
      const nuevaPosicionRelativa = convertirARelativo(posicionArrastre);
      
      const anotacionActualizada = {
        ...anotacion,
        posicion: nuevaPosicionRelativa,
        metadatos: {
          ...anotacion.metadatos,
          modificado: new Date().toISOString()
        }
      };

      onGuardarAnotacion?.(anotacionActualizada);
      console.log(`Arrastre finalizado - Nueva posición relativa: ${nuevaPosicionRelativa.x}, ${nuevaPosicionRelativa.y}`);
    }

    // NUEVO: Limpiar dimensiones guardadas
    setArrastrando(false);
    setAnotacionArrastrada(null);
    setPosicionArrastre({ x: 0, y: 0 });
    setOffsetArrastre({ x: 0, y: 0 });
    setDimensionesAnotacionArrastrada(null);
  }, [arrastrando, anotacionArrastrada, anotaciones, posicionArrastre, convertirARelativo, onGuardarAnotacion]);

  /**
   * Selecciona una anotación
   */
  const seleccionarAnotacion = useCallback((anotacionId, event) => {
    event?.stopPropagation();
    onSeleccionarAnotacion?.(anotacionId);
  }, [onSeleccionarAnotacion]);

  /**
   * Guarda los cambios de una anotación editada
   */
  const guardarCambiosAnotacion = useCallback((anotacionActualizada) => {
    onGuardarAnotacion?.(anotacionActualizada);
  }, [onGuardarAnotacion]);

  /**
   * Elimina una anotación
   */
  const eliminarAnotacion = useCallback((anotacionId) => {
    onEliminarAnotacion?.(anotacionId);
  }, [onEliminarAnotacion]);

  /**
   * Deselecciona anotaciones sin interferir con touch
   */
  const deseleccionarAnotacion = useCallback((event) => {
    if (herramientaActiva === 'texto') return;
    
    if (!event.target.closest('.anotacion-texto, .modal-overlay')) {
      onSeleccionarAnotacion?.(null);
    }
  }, [herramientaActiva, onSeleccionarAnotacion]);

  // Event listeners para mouse - SIN CAMBIOS
  useEffect(() => {
    if (!esDispositiveMovil) {
      const manejarMouseMove = (event) => manejarMovimiento(event);
      const manejarMouseUp = () => finalizarArrastre();

      if (arrastrando) {
        document.addEventListener('mousemove', manejarMouseMove);
        document.addEventListener('mouseup', manejarMouseUp);
      }

      return () => {
        document.removeEventListener('mousemove', manejarMouseMove);
        document.removeEventListener('mouseup', manejarMouseUp);
      };
    }
  }, [arrastrando, manejarMovimiento, finalizarArrastre, esDispositiveMovil]);

  // Event listeners para táctil - SIN CAMBIOS
  useEffect(() => {
    if (esDispositiveMovil) {
      const manejarTouchMove = (event) => {
        if (arrastrando) {
          manejarMovimiento(event);
        }
      };
      
      const manejarTouchEnd = () => {
        if (arrastrando) {
          finalizarArrastre();
        }
      };

      if (arrastrando) {
        document.addEventListener('touchmove', manejarTouchMove, { passive: false });
        document.addEventListener('touchend', manejarTouchEnd);
        document.addEventListener('touchcancel', manejarTouchEnd);
      }

      return () => {
        document.removeEventListener('touchmove', manejarTouchMove);
        document.removeEventListener('touchend', manejarTouchEnd);
        document.removeEventListener('touchcancel', manejarTouchEnd);
      };
    }
  }, [arrastrando, manejarMovimiento, finalizarArrastre, esDispositiveMovil]);

  // Métodos expuestos al componente padre
  useImperativeHandle(ref, () => ({
    deseleccionarTodos: () => {
      onSeleccionarAnotacion?.(null);
    },
    
    obtenerAnotacionSeleccionada: () => {
      return anotaciones.find(a => a.id === anotacionSeleccionada);
    },
    
    centrarEnAnotacion: (anotacionId) => {
      const anotacion = anotaciones.find(a => a.id === anotacionId);
      if (anotacion) {
        const posicionPixeles = convertirAPixeles(anotacion.posicion);
      }
    }
  }), [anotaciones, anotacionSeleccionada, onSeleccionarAnotacion, convertirAPixeles]);

  /**
   * Renderiza una anotación según su tipo
   */
  const renderizarAnotacion = useCallback((anotacion) => {
    if (!anotacion.posicion || !anotacion.dimensiones) {
      return null;
    }

    const posicionPixeles = convertirAPixeles(anotacion.posicion);
    const dimensionesPixeles = {
      ancho: anotacion.dimensiones.ancho * dimensionesPDF.ancho * zoom,
      alto: anotacion.dimensiones.alto * dimensionesPDF.alto * zoom
    };

    const posicionFinal = (arrastrando && anotacionArrastrada === anotacion.id) 
      ? posicionArrastre 
      : posicionPixeles;

    const yaGuardada = !anotacion.metadatos?.esNueva;
    let cursor = 'pointer';
    
    if (puedeArrastrar(anotacion) && yaGuardada) {
      cursor = 'move';
    } else if (herramientaActiva === 'cursor') {
      cursor = 'move';
    }

    const estilosAnotacion = {
      position: 'absolute',
      left: `${posicionFinal.x}px`,
      top: `${posicionFinal.y}px`,
      width: `${dimensionesPixeles.ancho}px`,
      height: `${dimensionesPixeles.alto}px`,
      zIndex: anotacionSeleccionada === anotacion.id ? 1000 : 100,
      cursor: cursor,
      touchAction: arrastrando ? 'none' : 'auto'
    };

    const manejarInicioArrastre = (event) => {
      iniciarArrastre(anotacion.id, event);
    };

    const manejarSeleccion = (event) => {
      if (!arrastrando) {
        seleccionarAnotacion(anotacion.id, event);
      }
    };

    switch (anotacion.tipo) {
      case 'texto':
        return (
          <div
            key={anotacion.id}
            style={estilosAnotacion}
            className={`anotacion-wrapper ${anotacionSeleccionada === anotacion.id ? 'seleccionada' : ''}`}
            onMouseDown={!esDispositiveMovil ? manejarInicioArrastre : undefined}
            onTouchStart={esDispositiveMovil ? manejarInicioArrastre : undefined}
            onClick={manejarSeleccion}
          >
            <TextoAnotacion
              anotacion={anotacion}
              seleccionada={anotacionSeleccionada === anotacion.id}
              editando={anotacion.metadatos?.editando || false}
              zoom={zoom}
              esDispositiveMovil={esDispositiveMovil}
              puedeArrastrar={puedeArrastrar(anotacion)}
              onGuardar={guardarCambiosAnotacion}
              onEliminar={() => eliminarAnotacion(anotacion.id)}
              onIniciarEdicion={() => seleccionarAnotacion(anotacion.id)}
            />
          </div>
        );
        
      default:
        return null;
    }
  }, [
    convertirAPixeles,
    dimensionesPDF,
    zoom,
    arrastrando,
    anotacionArrastrada,
    posicionArrastre,
    anotacionSeleccionada,
    herramientaActiva,
    esDispositiveMovil,
    puedeArrastrar,
    iniciarArrastre,
    seleccionarAnotacion,
    guardarCambiosAnotacion,
    eliminarAnotacion
  ]);

  // Calcular dimensiones de la capa
  const dimensionesCapa = {
    width: dimensionesPDF.ancho * zoom,
    height: dimensionesPDF.alto * zoom,
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'auto',
    touchAction: arrastrando ? 'none' : 'auto'
  };

  const eventosCapaPrincipal = {
    onClick: manejarClickCapa,
    onMouseDown: !esDispositiveMovil ? deseleccionarAnotacion : undefined,
  };

  return (
    <div
      ref={capaRef}
      className={`capa-anotaciones ${herramientaActiva} ${esDispositiveMovil ? 'movil' : 'desktop'} ${arrastrando ? 'arrastrando' : ''}`}
      style={dimensionesCapa}
      {...eventosCapaPrincipal}
    >
      {herramientaActiva === 'texto' && (
        <div className="cursor-texto-indicador">
          {esDispositiveMovil ? 'Toca para agregar texto' : 'Haz clic para agregar texto'}
        </div>
      )}

      {anotaciones.map(renderizarAnotacion)}

      {arrastrando && (
        <div className="overlay-arrastrando">
          <div className="indicador-posicion" style={{
            left: `${posicionArrastre.x}px`,
            top: `${posicionArrastre.y}px`
          }} />
        </div>
      )}

      {esDispositiveMovil && anotacionSeleccionada && !arrastrando && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          zIndex: 1001
        }}>
          Mantén presionado para arrastrar
        </div>
      )}

      {arrastrando && esDispositiveMovil && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: '10px',
          background: 'rgba(222, 0, 126, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10001
        }}>
          🎯 Arrastrando anotación
        </div>
      )}
    </div>
  );
});

CapaAnotaciones.displayName = 'CapaAnotaciones';

export default CapaAnotaciones;
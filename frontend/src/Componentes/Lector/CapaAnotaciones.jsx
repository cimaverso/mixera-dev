// src/Componentes/Lector/CapaAnotaciones.jsx - FIX SIMPLE DEL ARRASTRE MÓVIL
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
   * Obtiene coordenadas desde evento (mouse o táctil)
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
    const coords = obtenerCoordenadas(event);
    const x = coords.clientX - rect.left;
    const y = coords.clientY - rect.top;

    const limitesX = dimensionesPDF.ancho * zoom;
    const limitesY = dimensionesPDF.alto * zoom;

    if (x >= 0 && x <= limitesX && y >= 0 && y <= limitesY) {
      onCrearAnotacion?.({ x, y });
    }
  }, [herramientaActiva, dimensionesPDF, zoom, onCrearAnotacion, obtenerCoordenadas]);

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
   * Inicia el arrastre de una anotación (mouse y táctil)
   */
  const iniciarArrastre = useCallback((anotacionId, event) => {
    const anotacion = anotaciones.find(a => a.id === anotacionId);
    if (!anotacion || !puedeArrastrar(anotacion)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    
    const rect = capaRef.current.getBoundingClientRect();
    const coords = obtenerCoordenadas(event);
    
    const posicionAnotacion = convertirAPixeles(anotacion.posicion);
    const offsetX = coords.clientX - rect.left - posicionAnotacion.x;
    const offsetY = coords.clientY - rect.top - posicionAnotacion.y;
    
    setArrastrando(true);
    setAnotacionArrastrada(anotacionId);
    setOffsetArrastre({ x: offsetX, y: offsetY });
    setPosicionArrastre({
      x: coords.clientX - rect.left - offsetX,
      y: coords.clientY - rect.top - offsetY
    });

    onSeleccionarAnotacion?.(anotacionId);
    
    console.log(`Iniciando arrastre de anotación ${anotacionId} (${esDispositiveMovil ? 'táctil' : 'mouse'})`);
  }, [anotaciones, puedeArrastrar, onSeleccionarAnotacion, convertirAPixeles, obtenerCoordenadas, esDispositiveMovil]);

  /**
   * CORREGIDO: Maneja el movimiento durante el arrastre - FIX PRINCIPAL
   */
  const manejarMovimiento = useCallback((event) => {
    if (!arrastrando || !anotacionArrastrada) return;

    event.preventDefault();
    
    const rect = capaRef.current.getBoundingClientRect();
    const coords = obtenerCoordenadas(event);
    
    const nuevaX = coords.clientX - rect.left - offsetArrastre.x;
    const nuevaY = coords.clientY - rect.top - offsetArrastre.y;

    // FIX PRINCIPAL: Obtener dimensiones reales de la anotación que se está arrastrando
    const anotacion = anotaciones.find(a => a.id === anotacionArrastrada);
    if (!anotacion) return;
    
    const anchoAnotacion = anotacion.dimensiones.ancho * dimensionesPDF.ancho * zoom;
    const altoAnotacion = anotacion.dimensiones.alto * dimensionesPDF.alto * zoom;
    
    // Límites del PDF
    const limitesX = dimensionesPDF.ancho * zoom;
    const limitesY = dimensionesPDF.alto * zoom;

    // CORREGIDO: Usar las dimensiones reales de la anotación
    const xLimitada = Math.max(0, Math.min(nuevaX, limitesX - anchoAnotacion));
    const yLimitada = Math.max(0, Math.min(nuevaY, limitesY - altoAnotacion));

    setPosicionArrastre({ x: xLimitada, y: yLimitada });
  }, [arrastrando, anotacionArrastrada, dimensionesPDF, zoom, offsetArrastre, obtenerCoordenadas, anotaciones]);

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
      console.log(`Arrastre finalizado para anotación ${anotacionArrastrada}`);
    }

    setArrastrando(false);
    setAnotacionArrastrada(null);
    setPosicionArrastre({ x: 0, y: 0 });
    setOffsetArrastre({ x: 0, y: 0 });
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

  // CORREGIDO: Event listeners para táctil - SIMPLIFICADO
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
        // SIMPLIFICADO: Solo agregar listeners cuando sea necesario
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
      // SIMPLIFICADO: touchAction básico
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

  // SIMPLIFICADO: Calcular dimensiones de la capa
  const dimensionesCapa = {
    width: dimensionesPDF.ancho * zoom,
    height: dimensionesPDF.alto * zoom,
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'auto',
    // BÁSICO: Solo bloquear touch cuando realmente estamos arrastrando
    touchAction: arrastrando ? 'none' : 'auto'
  };

  const eventosCapaPrincipal = {
    onClick: manejarClickCapa,
    onMouseDown: !esDispositiveMovil ? deseleccionarAnotacion : undefined,
  };

  return (
    <div
      ref={capaRef}
      className={`capa-anotaciones ${herramientaActiva} ${esDispositiveMovil ? 'movil' : 'desktop'}`}
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

      {esDispositiveMovil && anotacionSeleccionada && (
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
    </div>
  );
});

CapaAnotaciones.displayName = 'CapaAnotaciones';

export default CapaAnotaciones;
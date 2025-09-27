// src/Componentes/Lector/CapaAnotaciones.jsx - VERSIÃ“N CORREGIDA SIN ROMPER TOUCH
import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import TextoAnotacion from './anotaciones/TextoAnotacion';

/**
 * Capa transparente superpuesta al PDF que maneja todas las anotaciones
 * CORREGIDO: SIN INTERFERIR CON EL TOUCH/ZOOM DEL SISTEMA
 */
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

  // Detectar si es dispositivo mÃ³vil
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
   * Convierte coordenadas relativas (0-1) a pÃ­xeles segÃºn zoom actual
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
   * Convierte coordenadas de pÃ­xeles a relativas (0-1)
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
   * Obtiene coordenadas desde evento (mouse o tÃ¡ctil)
   */
  const obtenerCoordenadas = useCallback((event) => {
    // Si es evento tÃ¡ctil
    if (event.touches && event.touches.length > 0) {
      return {
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY
      };
    }
    // Si es evento de mouse
    return {
      clientX: event.clientX,
      clientY: event.clientY
    };
  }, []);

  /**
   * CORREGIDO: Maneja el clic/toque en la capa SOLO para crear anotaciones
   */
  const manejarClickCapa = useCallback((event) => {
    // Solo crear anotaciÃ³n si la herramienta de texto estÃ¡ activa
    if (herramientaActiva !== 'texto') return;

    // Evitar crear si se hizo clic en una anotaciÃ³n existente o sus controles
    if (event.target.closest('.anotacion-texto, .controles-seleccion, .controles-inline, .modal-overlay')) return;

    // IMPORTANTE: NO prevenir comportamiento por defecto aquÃ­ para mantener touch del sistema
    const rect = capaRef.current.getBoundingClientRect();
    const coords = obtenerCoordenadas(event);
    const x = coords.clientX - rect.left;
    const y = coords.clientY - rect.top;

    // Verificar que el clic estÃ© dentro de los lÃ­mites del PDF
    const limitesX = dimensionesPDF.ancho * zoom;
    const limitesY = dimensionesPDF.alto * zoom;

    if (x >= 0 && x <= limitesX && y >= 0 && y <= limitesY) {
      onCrearAnotacion?.({ x, y });
    }
  }, [herramientaActiva, dimensionesPDF, zoom, onCrearAnotacion, obtenerCoordenadas]);

  /**
   * Determina si una anotaciÃ³n puede ser arrastrada
   */
  const puedeArrastrar = useCallback((anotacion) => {
    // En mÃ³vil: permitir arrastre si la anotaciÃ³n estÃ¡ en modo ediciÃ³n O si es cursor
    if (esDispositiveMovil) {
      const anotacionCompleta = anotaciones.find(a => a.id === anotacion.id);
      const enModoEdicion = anotacionCompleta && !anotacionCompleta.metadatos?.esNueva;
      return herramientaActiva === 'cursor' || enModoEdicion;
    }
    
    // En desktop: solo con cursor
    return herramientaActiva === 'cursor';
  }, [esDispositiveMovil, herramientaActiva, anotaciones]);

  /**
   * Inicia el arrastre de una anotaciÃ³n (mouse y tÃ¡ctil)
   */
  const iniciarArrastre = useCallback((anotacionId, event) => {
    const anotacion = anotaciones.find(a => a.id === anotacionId);
    if (!anotacion || !puedeArrastrar(anotacion)) {
      return;
    }

    // CORREGIDO: Solo prevenir si realmente vamos a arrastrar
    event.preventDefault();
    event.stopPropagation();
    
    const rect = capaRef.current.getBoundingClientRect();
    const coords = obtenerCoordenadas(event);
    
    // Calcular offset desde la esquina superior izquierda de la anotaciÃ³n
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
    
    console.log(`Iniciando arrastre de anotaciÃ³n ${anotacionId} (${esDispositiveMovil ? 'tÃ¡ctil' : 'mouse'})`);
  }, [anotaciones, puedeArrastrar, onSeleccionarAnotacion, convertirAPixeles, obtenerCoordenadas, esDispositiveMovil]);

  /**
   * Maneja el movimiento durante el arrastre (mouse y tÃ¡ctil)
   */
  const manejarMovimiento = useCallback((event) => {
    if (!arrastrando || !anotacionArrastrada) return;

    event.preventDefault();
    
    const rect = capaRef.current.getBoundingClientRect();
    const coords = obtenerCoordenadas(event);
    
    const nuevaX = coords.clientX - rect.left - offsetArrastre.x;
    const nuevaY = coords.clientY - rect.top - offsetArrastre.y;

    // Verificar lÃ­mites del PDF
    const limitesX = dimensionesPDF.ancho * zoom;
    const limitesY = dimensionesPDF.alto * zoom;

    const xLimitada = Math.max(0, Math.min(nuevaX, limitesX - 200)); // 200px ancho mÃ­nimo
    const yLimitada = Math.max(0, Math.min(nuevaY, limitesY - 60));  // 60px alto mÃ­nimo

    setPosicionArrastre({ x: xLimitada, y: yLimitada });
  }, [arrastrando, anotacionArrastrada, dimensionesPDF, zoom, offsetArrastre, obtenerCoordenadas]);

  /**
   * Finaliza el arrastre y actualiza la posiciÃ³n de la anotaciÃ³n
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
      console.log(`Arrastre finalizado para anotaciÃ³n ${anotacionArrastrada}`);
    }

    setArrastrando(false);
    setAnotacionArrastrada(null);
    setPosicionArrastre({ x: 0, y: 0 });
    setOffsetArrastre({ x: 0, y: 0 });
  }, [arrastrando, anotacionArrastrada, anotaciones, posicionArrastre, convertirARelativo, onGuardarAnotacion]);

  /**
   * Selecciona una anotaciÃ³n
   */
  const seleccionarAnotacion = useCallback((anotacionId, event) => {
    event?.stopPropagation();
    onSeleccionarAnotacion?.(anotacionId);
  }, [onSeleccionarAnotacion]);

  /**
   * Guarda los cambios de una anotaciÃ³n editada
   */
  const guardarCambiosAnotacion = useCallback((anotacionActualizada) => {
    onGuardarAnotacion?.(anotacionActualizada);
  }, [onGuardarAnotacion]);

  /**
   * Elimina una anotaciÃ³n
   */
  const eliminarAnotacion = useCallback((anotacionId) => {
    onEliminarAnotacion?.(anotacionId);
  }, [onEliminarAnotacion]);

  /**
   * CORREGIDO: Deselecciona anotaciones sin interferir con touch
   */
  const deseleccionarAnotacion = useCallback((event) => {
    if (herramientaActiva === 'texto') return; // No deseleccionar en modo texto
    
    if (!event.target.closest('.anotacion-texto, .modal-overlay')) {
      onSeleccionarAnotacion?.(null);
    }
  }, [herramientaActiva, onSeleccionarAnotacion]);

  // Event listeners para mouse - SIN INTERFERIR CON TOUCH
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

  // Event listeners para tÃ¡ctil - SOLO DURANTE ARRASTRE
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

  // MÃ©todos expuestos al componente padre
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
   * Renderiza una anotaciÃ³n segÃºn su tipo
   */
  const renderizarAnotacion = useCallback((anotacion) => {
    // Verificar que la anotaciÃ³n tenga datos vÃ¡lidos
    if (!anotacion.posicion || !anotacion.dimensiones) {
      return null;
    }

    const posicionPixeles = convertirAPixeles(anotacion.posicion);
    const dimensionesPixeles = {
      ancho: anotacion.dimensiones.ancho * dimensionesPDF.ancho * zoom,
      alto: anotacion.dimensiones.alto * dimensionesPDF.alto * zoom
    };

    // Usar posiciÃ³n de arrastre si esta anotaciÃ³n se estÃ¡ arrastrando
    const posicionFinal = (arrastrando && anotacionArrastrada === anotacion.id) 
      ? posicionArrastre 
      : posicionPixeles;

    // Determinar cursor segÃºn el estado
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
      // CORREGIDO: touchAction dinÃ¡mico segÃºn estado
      touchAction: arrastrando ? 'none' : 'auto'
    };

    const manejarInicioArrastre = (event) => {
      // Tanto para mouse como para tÃ¡ctil
      iniciarArrastre(anotacion.id, event);
    };

    const manejarSeleccion = (event) => {
      // Si no estÃ¡ arrastrando, seleccionar
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

  // CORREGIDO: Calcular dimensiones de la capa SIN interferir con touch
  const dimensionesCapa = {
    width: dimensionesPDF.ancho * zoom,
    height: dimensionesPDF.alto * zoom,
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'auto',
    // CRÃTICO: Solo bloquear touch cuando realmente estamos arrastrando
    touchAction: arrastrando ? 'none' : 'auto'
  };

  // CORREGIDO: Eventos principales que NO bloquean el sistema
  const eventosCapaPrincipal = {
    onClick: manejarClickCapa,
    onMouseDown: !esDispositiveMovil ? deseleccionarAnotacion : undefined,
    // IMPORTANTE: NO usar onTouchStart aquÃ­ para no interferir con zoom/scroll
  };

  return (
    <div
      ref={capaRef}
      className={`capa-anotaciones ${herramientaActiva} ${esDispositiveMovil ? 'movil' : 'desktop'}`}
      style={dimensionesCapa}
      {...eventosCapaPrincipal}
    >
      {/* Indicador visual cuando estÃ¡ en modo texto */}
      {herramientaActiva === 'texto' && (
        <div className="cursor-texto-indicador">
          {esDispositiveMovil ? 'Toca para agregar texto' : 'Haz clic para agregar texto'}
        </div>
      )}

      {/* Renderizar todas las anotaciones */}
      {anotaciones.map(renderizarAnotacion)}

      {/* Overlay de arrastre */}
      {arrastrando && (
        <div className="overlay-arrastrando">
          <div className="indicador-posicion" style={{
            left: `${posicionArrastre.x}px`,
            top: `${posicionArrastre.y}px`
          }} />
        </div>
      )}

      {/* Indicador de capacidades en mÃ³vil */}
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
          ðŸ’¡ MantÃ©n presionado para arrastrar
        </div>
      )}
    </div>
  );
});

CapaAnotaciones.displayName = 'CapaAnotaciones';

export default CapaAnotaciones;
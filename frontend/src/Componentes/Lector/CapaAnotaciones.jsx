// src/Componentes/Lector/CapaAnotaciones.jsx - VERSIÓN LIMPIA
import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import TextoAnotacion from './anotaciones/TextoAnotacion';

/**
 * Capa transparente superpuesta al PDF que maneja todas las anotaciones
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
   * Maneja el clic en la capa para crear nuevas anotaciones
   */
  const manejarClickCapa = useCallback((event) => {
    // Solo crear anotación si la herramienta de texto está activa
    if (herramientaActiva !== 'texto') return;

    // Evitar crear si se hizo clic en una anotación existente o sus controles
    if (event.target.closest('.anotacion-texto, .controles-seleccion, .controles-inline')) return;

    const rect = capaRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Verificar que el clic esté dentro de los límites del PDF
    const limitesX = dimensionesPDF.ancho * zoom;
    const limitesY = dimensionesPDF.alto * zoom;

    if (x >= 0 && x <= limitesX && y >= 0 && y <= limitesY) {
      onCrearAnotacion?.({ x, y });
    }
  }, [herramientaActiva, dimensionesPDF, zoom, onCrearAnotacion]);

  /**
   * Inicia el arrastre de una anotación
   */
  const iniciarArrastre = useCallback((anotacionId, event) => {
    if (herramientaActiva !== 'cursor') return;

    event.stopPropagation();
    setArrastrando(true);
    setAnotacionArrastrada(anotacionId);
    
    const rect = capaRef.current.getBoundingClientRect();
    setPosicionArrastre({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });

    onSeleccionarAnotacion?.(anotacionId);
  }, [herramientaActiva, onSeleccionarAnotacion]);

  /**
   * Maneja el movimiento durante el arrastre
   */
  const manejarMovimiento = useCallback((event) => {
    if (!arrastrando || !anotacionArrastrada) return;

    const rect = capaRef.current.getBoundingClientRect();
    const nuevaX = event.clientX - rect.left;
    const nuevaY = event.clientY - rect.top;

    // Verificar límites del PDF
    const limitesX = dimensionesPDF.ancho * zoom;
    const limitesY = dimensionesPDF.alto * zoom;

    const xLimitada = Math.max(0, Math.min(nuevaX, limitesX - 200)); // 200px ancho mínimo
    const yLimitada = Math.max(0, Math.min(nuevaY, limitesY - 60));  // 60px alto mínimo

    setPosicionArrastre({ x: xLimitada, y: yLimitada });
  }, [arrastrando, anotacionArrastrada, dimensionesPDF, zoom]);

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
    }

    setArrastrando(false);
    setAnotacionArrastrada(null);
    setPosicionArrastre({ x: 0, y: 0 });
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
   * Deselecciona anotaciones al hacer clic fuera
   */
  const deseleccionarAnotacion = useCallback((event) => {
    if (herramientaActiva === 'texto') return; // No deseleccionar en modo texto
    
    if (!event.target.closest('.anotacion-texto')) {
      onSeleccionarAnotacion?.(null);
    }
  }, [herramientaActiva, onSeleccionarAnotacion]);

  // Event listeners para arrastre
  useEffect(() => {
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
  }, [arrastrando, manejarMovimiento, finalizarArrastre]);

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
    // Verificar que la anotación tenga datos válidos
    if (!anotacion.posicion || !anotacion.dimensiones) {
      return null;
    }

    const posicionPixeles = convertirAPixeles(anotacion.posicion);
    const dimensionesPixeles = {
      ancho: anotacion.dimensiones.ancho * dimensionesPDF.ancho * zoom,
      alto: anotacion.dimensiones.alto * dimensionesPDF.alto * zoom
    };

    // Usar posición de arrastre si esta anotación se está arrastrando
    const posicionFinal = (arrastrando && anotacionArrastrada === anotacion.id) 
      ? posicionArrastre 
      : posicionPixeles;

    const estilosAnotacion = {
      position: 'absolute',
      left: `${posicionFinal.x}px`,
      top: `${posicionFinal.y}px`,
      width: `${dimensionesPixeles.ancho}px`,
      height: `${dimensionesPixeles.alto}px`,
      zIndex: anotacionSeleccionada === anotacion.id ? 1000 : 100,
      cursor: herramientaActiva === 'cursor' ? 'move' : 'pointer'
    };

    switch (anotacion.tipo) {
      case 'texto':
        return (
          <div
            key={anotacion.id}
            style={estilosAnotacion}
            className={`anotacion-wrapper ${anotacionSeleccionada === anotacion.id ? 'seleccionada' : ''}`}
            onMouseDown={(e) => iniciarArrastre(anotacion.id, e)}
            onClick={(e) => seleccionarAnotacion(anotacion.id, e)}
          >
            <TextoAnotacion
              anotacion={anotacion}
              seleccionada={anotacionSeleccionada === anotacion.id}
              editando={anotacion.metadatos?.editando || false}
              zoom={zoom}
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
    iniciarArrastre,
    seleccionarAnotacion,
    guardarCambiosAnotacion,
    eliminarAnotacion
  ]);

  // Calcular dimensiones de la capa según el PDF y zoom
  const dimensionesCapa = {
    width: dimensionesPDF.ancho * zoom,
    height: dimensionesPDF.alto * zoom,
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'auto'
  };

  return (
    <div
      ref={capaRef}
      className={`capa-anotaciones ${herramientaActiva}`}
      style={dimensionesCapa}
      onClick={manejarClickCapa}
      onMouseDown={deseleccionarAnotacion}
    >
      {/* Indicador visual cuando está en modo texto */}
      {herramientaActiva === 'texto' && (
        <div className="cursor-texto-indicador">
          Haz clic para agregar texto
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
    </div>
  );
});

CapaAnotaciones.displayName = 'CapaAnotaciones';

export default CapaAnotaciones;
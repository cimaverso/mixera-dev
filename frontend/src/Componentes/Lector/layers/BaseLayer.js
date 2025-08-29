// BaseLayer.js - SIMPLIFICADO SOLO PARA TEXTOS v3
// Gestión de layers optimizada sin conflictos

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useOverlayManager, useAutoOverlays } from './OverlayManager.js';

/**
 * Hook principal para layers - SIMPLIFICADO PARA TEXTOS ÚNICAMENTE
 */
export const useBaseLayer = ({
  herramientaActiva,
  tipoHerramienta,
  elementos = [],
  paginaActual,
  visorInfo = {},
  onCleanup = () => {}
}) => {
  const layerRef = useRef(null);
  
  // OverlayManager independiente
  const overlayManager = useOverlayManager(tipoHerramienta);
  
  // Estados y valores básicos
  const activo = useMemo(() => herramientaActiva === tipoHerramienta, [herramientaActiva, tipoHerramienta]);
  const activoAnterior = useRef(activo);
  
  // Auto-gestión de overlays
  const overlayResult = useAutoOverlays(overlayManager, activo, visorInfo);
  const overlaysCreados = overlayResult?.overlaysCreados || 0;
  const pdfListoState = overlayResult?.pdfListo || false;
  
  // Estados locales simplificados
  const estadosLocalesRef = useRef({
    modalesAbiertos: new Map(),
    operacionesEnCurso: new Map(),
    elementosTemporales: new Map(),
    ultimaLimpieza: 0,
    prefijoHerramienta: `${tipoHerramienta}_${Date.now()}_`
  });

  console.log(`🔧 useBaseLayer[${tipoHerramienta}]:`, {
    herramientaActiva,
    tipoHerramienta,
    activo,
    modo: visorInfo?.mode || 'single',
    scale: visorInfo?.scale || 1,
    elementosCount: elementos.length,
    overlayManager: !!overlayManager,
    overlaysCreados,
    pdfListo: pdfListoState
  });

  // ===================== GESTIÓN DE MODALES SIMPLIFICADA =====================
  
  const crearModalEstandar = useCallback(({ 
    titulo = '', 
    placeholder = '', 
    valor = '', 
    onGuardar, 
    onCancelar, 
    onEliminar = null
  }) => {
    console.warn('⚠️ useBaseLayer: crearModalEstandar está deprecated. Use el modal optimizado del TextosLayer.');
    
    // Retornar un div vacío como fallback
    const div = document.createElement('div');
    div.style.display = 'none';
    return div;
  }, [tipoHerramienta]);

  // ===================== GESTIÓN DE ESTADOS LOCALES SIMPLIFICADA =====================

  const limpiarEstadosLocales = useCallback(() => {
    const estados = estadosLocalesRef.current;
    const ahora = Date.now();
    
    if (ahora - estados.ultimaLimpieza < 100) {
      return; // Debounce
    }
    
    estados.ultimaLimpieza = ahora;

    if (estados.modalesAbiertos.size > 0) {
      console.log(`⚠️ ${tipoHerramienta}: Saltando limpieza - hay ${estados.modalesAbiertos.size} modales activos`);
      return;
    }
    
    console.log(`🧹 Limpiando estados de ${tipoHerramienta}:`, {
      modales: estados.modalesAbiertos.size,
      operaciones: estados.operacionesEnCurso.size,
      temporales: estados.elementosTemporales.size
    });

    // Limpiar modales
    estados.modalesAbiertos.forEach((modal, modalId) => {
      if (modal && modal.parentNode && modal.dataset.herramienta === tipoHerramienta) {
        console.log(`🗑️ ${tipoHerramienta}: Removiendo modal:`, modalId);
        try {
          modal.remove();
        } catch (error) {
          console.warn(`⚠️ Error removiendo modal ${modalId}:`, error);
        }
      }
    });
    estados.modalesAbiertos.clear();

    // Ejecutar operaciones pendientes
    estados.operacionesEnCurso.forEach((operacion, operacionId) => {
      if (typeof operacion === 'function') {
        try {
          console.log(`🛑 ${tipoHerramienta}: Cancelando operación:`, operacionId);
          operacion();
        } catch (error) {
          console.warn(`⚠️ Error al cancelar operación:`, error);
        }
      }
    });
    estados.operacionesEnCurso.clear();

    // Limpiar elementos temporales (no persistentes)
    estados.elementosTemporales.forEach((elemento, elementoId) => {
      if (elemento && 
          elemento.parentNode && 
          elemento.dataset.herramienta === tipoHerramienta &&
          !elemento.dataset.persistent) {
        console.log(`🗑️ ${tipoHerramienta}: Removiendo elemento temporal:`, elementoId);
        try {
          elemento.remove();
        } catch (error) {
          console.warn(`⚠️ Error removiendo elemento ${elementoId}:`, error);
        }
      }
    });
    estados.elementosTemporales.clear();

    onCleanup();
    console.log(`✅ Estados de ${tipoHerramienta} limpiados`);
  }, [tipoHerramienta, onCleanup]);

  const registrarModal = useCallback((modalElement) => {
    if (modalElement && modalElement.dataset.modalId) {
      const modalId = modalElement.dataset.modalId;
      estadosLocalesRef.current.modalesAbiertos.set(modalId, modalElement);
      console.log(`📝 ${tipoHerramienta}: Modal registrado:`, modalId);
    }
  }, [tipoHerramienta]);

  const desregistrarModal = useCallback((modalElement) => {
    if (modalElement && modalElement.dataset.modalId) {
      const modalId = modalElement.dataset.modalId;
      estadosLocalesRef.current.modalesAbiertos.delete(modalId);
      console.log(`❌ ${tipoHerramienta}: Modal desregistrado:`, modalId);
    }
  }, [tipoHerramienta]);

  const registrarOperacion = useCallback((operacionId, cancelFn) => {
    if (typeof cancelFn === 'function') {
      estadosLocalesRef.current.operacionesEnCurso.set(operacionId, cancelFn);
      console.log(`🔧 ${tipoHerramienta}: Operación registrada:`, operacionId);
    }
  }, [tipoHerramienta]);

  const desregistrarOperacion = useCallback((operacionId) => {
    estadosLocalesRef.current.operacionesEnCurso.delete(operacionId);
    console.log(`✅ ${tipoHerramienta}: Operación desregistrada:`, operacionId);
  }, [tipoHerramienta]);

  const registrarElementoTemporal = useCallback((elemento) => {
    if (elemento) {
      const elementoId = `${estadosLocalesRef.current.prefijoHerramienta}temp_${Date.now()}`;
      elemento.dataset.herramienta = tipoHerramienta;
      elemento.dataset.elementoId = elementoId;
      estadosLocalesRef.current.elementosTemporales.set(elementoId, elemento);
      console.log(`📦 ${tipoHerramienta}: Elemento temporal registrado:`, elementoId);
    }
  }, [tipoHerramienta]);

  // ===================== FUNCIONES DE OVERLAY =====================

  const getOverlay = useCallback((numeroPagina) => {
    return overlayManager?.getOverlay(numeroPagina);
  }, [overlayManager]);

  const registrarEventListener = useCallback((numeroPagina, elemento, evento, handler, opciones) => {
    if (!overlayManager) {
      console.warn(`⚠️ ${tipoHerramienta}: OverlayManager no disponible para registrar evento`);
      return () => {};
    }
    return overlayManager.registrarEventListener(numeroPagina, elemento, evento, handler, opciones);
  }, [overlayManager, tipoHerramienta]);

  // ===================== EFECTOS PRINCIPALES =====================

  useEffect(() => {
    const cambioDeHerramienta = activoAnterior.current !== activo;
    
    if (cambioDeHerramienta) {
      console.log(`🔄 ${tipoHerramienta}: ${activoAnterior.current ? 'ACTIVO' : 'INACTIVO'} → ${activo ? 'ACTIVO' : 'INACTIVO'}`);
      
      // Solo limpiar cuando ESTA herramienta específica se desactiva
      if (activoAnterior.current && !activo) {
        console.log(`🎯 ${tipoHerramienta}: Limpiando estados (herramienta desactivándose)`);
        
        setTimeout(() => {
          limpiarEstadosLocales();
        }, 50);
      }
      
      activoAnterior.current = activo;
    }
  }, [activo, tipoHerramienta, limpiarEstadosLocales]);

  // Notificar cambios de estado al OverlayManager
  useEffect(() => {
    if (overlayManager) {
      overlayManager.setActive(activo);
    }
  }, [overlayManager, activo]);

  // Manejar cambios de escala
  useEffect(() => {
    if (overlayManager && visorInfo?.scale) {
      // Los overlays se actualizan automáticamente con CSS,
      // pero podríamos notificar cambios específicos aquí
      console.log(`🔍 ${tipoHerramienta}: Escala actualizada a ${visorInfo.scale}`);
    }
  }, [overlayManager, visorInfo?.scale, tipoHerramienta]);

  const elementosEnPaginaActual = useMemo(() => {
    return elementos.filter(e => e.pagina === paginaActual);
  }, [elementos, paginaActual]);

  // ===================== API PÚBLICA SIMPLIFICADA =====================

  return {
    // Estados básicos
    activo,
    layerRef,
    overlaysCreados,
    pdfListo: pdfListoState,
    elementosEnPaginaActual,
    tipoHerramienta,
    visorInfo,
    
    // OverlayManager functions
    overlayManager,
    getOverlay,
    registrarEventListener,
    
    // Modal functions (deprecated, usar modal optimizado)
    crearModalEstandar,
    
    // Estado management
    registrarModal,
    desregistrarModal,
    registrarOperacion,
    desregistrarOperacion,
    registrarElementoTemporal,
    
    // Cleanup específico
    limpiarEstadosLocales
  };
};

/**
 * Hook para eventos de overlay simplificado
 */
export const useOverlayEvents = ({
  overlayManager,
  numeroPagina,
  activo,
  tipoHerramienta,
  onElementClick,
  onLayerClick
}) => {
  
  const handleClick = useCallback((e) => {
    if (!activo) return;

    e.preventDefault();
    e.stopPropagation();

    // Buscar elemento con ID de la herramienta específica
    const elementoConId = e.target.closest(`[data-${tipoHerramienta}-id]`);
    if (elementoConId) {
      const elementId = elementoConId.dataset[`${tipoHerramienta}Id`];
      onElementClick?.(e, elementId);
      return;
    }

    // Verificar elementos persistentes
    const elementoPersistente = e.target.closest(`[data-persistent-type="${tipoHerramienta}"]`);
    if (elementoPersistente) {
      const persistentId = elementoPersistente.dataset.persistentId;
      onElementClick?.(e, persistentId);
      return;
    }

    // Click en el overlay mismo
    const overlay = overlayManager?.getOverlay(numeroPagina);
    if (e.target === overlay || e.target.closest(`.${tipoHerramienta}-overlay-layer-v2`) === overlay) {
      onLayerClick?.(e);
    }
  }, [activo, tipoHerramienta, onElementClick, onLayerClick, overlayManager, numeroPagina]);

  useEffect(() => {
    if (!overlayManager || !numeroPagina) return;

    const overlay = overlayManager.getOverlay(numeroPagina);
    if (!overlay) return;

    if (activo) {
      const cleanup = overlayManager.registrarEventListener(
        numeroPagina, 
        overlay, 
        'mousedown', 
        handleClick, 
        { passive: false }
      );
      
      return cleanup;
    }
  }, [activo, handleClick, overlayManager, numeroPagina]);

  return { handleClick };
};
// NotasLayer.jsx - VERSIÓN CON EVENTOS CORREGIDOS v6
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useBaseLayer } from './BaseLayer.js';
import { usePersistentRenderer } from './PersistentRenderer.js';

const NotasLayer = ({
  herramientaActiva,
  paginaActual,
  visorInfo,
  notas = [],
  onAddNota = () => {},
  onEditNota = () => {},
  onDeleteNota = () => {},
  onDesactivarHerramienta = () => {},
}) => {
  console.log('📝 NotasLayer render:', {
    activa: herramientaActiva === 'nota',
    paginaActual,
    cantidadNotas: notas.length,
    modo: visorInfo?.mode || 'single'
  });

  // Estados locales (independientes)
  const [notaTemporal, setNotaTemporal] = useState(null);
  const [notaEditando, setNotaEditando] = useState(null);

  // NUEVO: Usar PersistentRenderer en lugar de renderizado manual
  const persistentRenderer = usePersistentRenderer('nota');

  const {
    activo,
    layerRef,
    overlaysCreados,
    overlayManager,
    getOverlay,
    registrarEventListener,
    crearModalEstandar,
    registrarModal,
    desregistrarModal,
    registrarElementoTemporal,
    elementosEnPaginaActual
  } = useBaseLayer({
    herramientaActiva,
    tipoHerramienta: 'nota',
    elementos: notas,
    paginaActual,
    visorInfo,
    onCleanup: () => {
      setNotaTemporal(null);
      setNotaEditando(null);
      console.log('🧹 NotasLayer: Estados locales limpiados');
    }
  });

  // ===================== ACTIVACIÓN DEL PERSISTENT RENDERER =====================
  
  // CRÍTICO: Activar/desactivar renderer SIN recrear elementos
  useEffect(() => {
    if (persistentRenderer) {
      persistentRenderer.setActive(activo);
      console.log(`🔄 NotasLayer: PersistentRenderer ${activo ? 'ACTIVADO' : 'DESACTIVADO'}`);
    }
  }, [activo, persistentRenderer]);

  // ===================== SINCRONIZACIÓN CON DATOS =====================
  
  // CRÍTICO: Sincronizar notas SIN recrear elementos existentes
  useEffect(() => {
    if (!persistentRenderer || !overlayManager) return;
    if (visorInfo?.mode !== 'single') return;

    const sincronizarNotas = async () => {
      console.log('🔄 NotasLayer: Sincronizando notas con PersistentRenderer...');
      
      try {
        // Obtener overlays disponibles
        const paginas = await overlayManager.buscarPaginas();
        const overlaysPorPagina = new Map();
        
        paginas.forEach((paginaElement, index) => {
          const numeroPagina = index + 1;
          const overlay = overlayManager.getOverlay(numeroPagina);
          if (overlay) {
            overlaysPorPagina.set(numeroPagina, overlay);
          }
        });
        
        // CRÍTICO: Sincronizar SIN destruir elementos existentes
        persistentRenderer.sincronizar(notas, overlaysPorPagina);
        
        console.log(`✅ NotasLayer: ${notas.length} notas sincronizadas`);
      } catch (error) {
        console.error('❌ NotasLayer: Error sincronizando notas:', error);
      }
    };

    sincronizarNotas();
  }, [notas, persistentRenderer, overlayManager, visorInfo?.mode, overlaysCreados]);

  // ===================== CREAR NOTA TEMPORAL =====================
  const crearNotaTemporal = useCallback((overlay, x, y, numeroPagina) => {
    console.log('📝 NotasLayer: Creando nota temporal en página', numeroPagina);
    
    // CRÍTICO: Verificar que no hay temporal existente
    if (notaTemporal) {
      console.log('⚠️ NotasLayer: Ya existe nota temporal, ignorando');
      return;
    }
    
    // Limpiar cualquier temporal huérfano
    const temporalesExistentes = overlay.querySelectorAll('.nota-temporal');
    temporalesExistentes.forEach(temp => temp.remove());
    
    const notaContainer = document.createElement('div');
    notaContainer.className = 'nota-temporal';
    notaContainer.dataset.paginaCreacion = numeroPagina.toString();
    notaContainer.style.cssText = `
      position: absolute;
      left: ${x * 100}%;
      top: ${y * 100}%;
      transform: translate(-50%, -50%);
      z-index: 200;
    `;
    
    const icono = document.createElement('div');
    icono.className = 'nota-icono-temporal';
    icono.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#ffeb3b" stroke="#9e9e9e" stroke-width="1">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <circle cx="12" cy="12" r="2" fill="#333" />
      </svg>
    `;
    
    const modal = crearModalEstandar({
      titulo: `Nueva nota - Página ${numeroPagina}`,
      placeholder: 'Escribe tu nota aquí...',
      onGuardar: (texto) => {
        console.log('💾 NotasLayer: Guardando nueva nota:', { numeroPagina, x, y, texto });
        
        // CORREGIDO: Usar numeroPagina de la función, no paginaActual
        onAddNota({ pagina: numeroPagina, x, y, texto });
        
        // Limpiar estados
        notaContainer.remove();
        desregistrarModal(modal);
        setNotaTemporal(null);
        onDesactivarHerramienta();
      },
      onCancelar: () => {
        console.log('❌ NotasLayer: Cancelando nueva nota');
        notaContainer.remove();
        desregistrarModal(modal);
        setNotaTemporal(null);
        onDesactivarHerramienta();
      }
    });
    
    registrarModal(modal);
    registrarElementoTemporal(notaContainer);
    
    notaContainer.appendChild(icono);
    notaContainer.appendChild(modal);
    overlay.appendChild(notaContainer);
    
    // IMPORTANTE: Establecer estado después de crear elemento
    setNotaTemporal({ x, y, pagina: numeroPagina, elemento: notaContainer });
    
    // Focus en textarea
    setTimeout(() => {
      const textarea = modal.querySelector('textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  }, [onAddNota, onDesactivarHerramienta, registrarModal, desregistrarModal, registrarElementoTemporal, crearModalEstandar, notaTemporal]);

  // ===================== MODAL EDICIÓN (CORREGIDO) =====================
  const abrirModalEdicion = useCallback((nota, elemento, numeroPagina) => {
    console.log('✏️ NotasLayer: Abriendo modal de edición:', nota.id);
    
    // CRÍTICO: Verificar que no hay modal ya abierto para esta nota
    if (notaEditando && notaEditando.id === nota.id) {
      console.log('⚠️ NotasLayer: Modal ya abierto para esta nota, ignorando');
      return;
    }
    
    // CRÍTICO: Verificar que no hay modal en el elemento
    const modalExistente = elemento.querySelector('.modal-edicion-nota');
    if (modalExistente) {
      console.log('⚠️ NotasLayer: Ya hay un modal en este elemento, ignorando');
      return;
    }
    
    const modal = crearModalEstandar({
      titulo: `Editar nota - Página ${numeroPagina}`,
      placeholder: 'Edita tu nota...',
      valor: nota.texto,
      onGuardar: (texto) => {
        console.log('💾 NotasLayer: Guardando edición:', { id: nota.id, texto });
        
        // CORREGIDO: Preservar todas las propiedades
        onEditNota({ 
          id: nota.id, 
          texto,
          x: nota.x,
          y: nota.y,
          pagina: nota.pagina
        });
        
        modal.remove();
        desregistrarModal(modal);
        setNotaEditando(null);
        onDesactivarHerramienta();
      },
      onCancelar: () => {
        console.log('❌ NotasLayer: Cancelando edición');
        modal.remove();
        desregistrarModal(modal);
        setNotaEditando(null);
      },
      onEliminar: () => {
        console.log('🗑️ NotasLayer: Eliminando nota:', nota.id);
        
        if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
          onDeleteNota(nota.id);
          modal.remove();
          desregistrarModal(modal);
          setNotaEditando(null);
          onDesactivarHerramienta();
        }
      }
    });
    
    registrarModal(modal);
    elemento.appendChild(modal);
    setNotaEditando({ id: nota.id, elemento, modal });
    
    setTimeout(() => {
      const textarea = modal.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 100);
  }, [onEditNota, onDeleteNota, onDesactivarHerramienta, registrarModal, desregistrarModal, crearModalEstandar, notaEditando]);

  // ===================== EVENTOS DE OVERLAY =====================
  const handleLayerClick = useCallback((e, overlay, numeroPagina) => {
    console.log('🖱️ NotasLayer: Click en layer página', numeroPagina);
    
    // CRÍTICO: Evitar si hay elementos temporales o modales
    if (notaTemporal || 
        overlay.querySelector('.nota-temporal') || 
        overlay.querySelector('.modal-edicion-nota')) {
      console.log('⚠️ NotasLayer: Click ignorado - hay elementos temporales o modales');
      return;
    }
    
    const rect = overlay.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Validar área
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      console.log('❌ NotasLayer: Click fuera del área válida');
      return;
    }
    
    console.log('✅ NotasLayer: Creando nota en:', { x, y, numeroPagina });
    crearNotaTemporal(overlay, x, y, numeroPagina);
  }, [crearNotaTemporal, notaTemporal]);

  // ===================== CONFIGURAR EVENTOS ESPECÍFICOS DE NOTA - CORREGIDO =====================
  const configurarEventosNota = useCallback((notaElement, nota, numeroPagina) => {
    if (!activo) return;
    
    console.log('🎧 NotasLayer: Configurando eventos para nota:', nota.id);
    
    // Configurar drag & drop y edición
    let isDragging = false;
    let dragStarted = false;
    let startTime = 0;
    let startPos = { x: 0, y: 0 };
    let dragOffset = { x: 0, y: 0 };
    
    const handleMouseDown = (e) => {
      if (e.button !== 0) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      console.log('🖱️ NotasLayer: MouseDown en nota:', nota.id);
      
      isDragging = false;
      dragStarted = false;
      startTime = Date.now();
      startPos = { x: e.clientX, y: e.clientY };
      
      // Calcular offset preciso
      const overlay = overlayManager.getOverlay(numeroPagina);
      if (!overlay) return;
      
      const overlayRect = overlay.getBoundingClientRect();
      const notaRect = notaElement.getBoundingClientRect();
      const notaCenterX = notaRect.left + notaRect.width / 2;
      const notaCenterY = notaRect.top + notaRect.height / 2;
      
      dragOffset = {
        x: (e.clientX - notaCenterX) / overlayRect.width,
        y: (e.clientY - notaCenterY) / overlayRect.height
      };
      
      const handleMouseMove = (e) => {
        const timeDiff = Date.now() - startTime;
        const distance = Math.sqrt(
          Math.pow(e.clientX - startPos.x, 2) + 
          Math.pow(e.clientY - startPos.y, 2)
        );
        
        if ((distance > 5 || timeDiff > 200) && !dragStarted) {
          dragStarted = true;
          isDragging = true;
          notaElement.style.cursor = 'grabbing';
          notaElement.style.opacity = '0.9';
          notaElement.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))';
          notaElement.style.zIndex = '300';
          notaElement.setAttribute('data-dragging', 'true');
          
          console.log('🎯 NotasLayer: Iniciando drag de nota:', nota.id);
        }
        
        if (isDragging) {
          const currentOverlay = overlayManager.getOverlay(numeroPagina);
          if (!currentOverlay) return;
          
          const currentOverlayRect = currentOverlay.getBoundingClientRect();
          let newX = (e.clientX - currentOverlayRect.left) / currentOverlayRect.width - dragOffset.x;
          let newY = (e.clientY - currentOverlayRect.top) / currentOverlayRect.height - dragOffset.y;
          
          newX = Math.max(0.02, Math.min(0.98, newX));
          newY = Math.max(0.02, Math.min(0.98, newY));
          
          notaElement.style.left = `${newX * 100}%`;
          notaElement.style.top = `${newY * 100}%`;
        }
      };
      
      const handleMouseUp = (e) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        if (isDragging) {
          const finalOverlay = overlayManager.getOverlay(numeroPagina);
          if (finalOverlay) {
            const finalOverlayRect = finalOverlay.getBoundingClientRect();
            const finalNotaRect = notaElement.getBoundingClientRect();
            const finalCenterX = finalNotaRect.left + finalNotaRect.width / 2;
            const finalCenterY = finalNotaRect.top + finalNotaRect.height / 2;
            
            const finalX = (finalCenterX - finalOverlayRect.left) / finalOverlayRect.width;
            const finalY = (finalCenterY - finalOverlayRect.top) / finalOverlayRect.height;
            
            onEditNota({ 
              id: nota.id, 
              x: finalX, 
              y: finalY,
              texto: nota.texto,
              pagina: nota.pagina
            });
          }
          
          isDragging = false;
          notaElement.style.cursor = 'pointer';
          notaElement.style.opacity = '1';
          notaElement.style.filter = 'none';
          notaElement.style.zIndex = '160';
          notaElement.removeAttribute('data-dragging');
          
          console.log('✅ NotasLayer: Drag completado para nota:', nota.id);
        } else {
          // Era un click simple - abrir modal de edición
          console.log('🖱️ NotasLayer: Click simple en nota:', nota.id);
          
          setTimeout(() => {
            if (!notaEditando || notaEditando.id !== nota.id) {
              // CORREGIDO: Obtener overlay correctamente
              const currentOverlay = overlayManager.getOverlay(numeroPagina);
              const modalExistente = currentOverlay ? currentOverlay.querySelector('.modal-edicion-nota') : null;
              if (!modalExistente) {
                abrirModalEdicion(nota, notaElement, numeroPagina);
              }
            }
          }, 50);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
    };

    // Registrar evento principal
    registrarEventListener(numeroPagina, notaElement, 'mousedown', handleMouseDown, { passive: false });
    
  }, [activo, overlayManager, onEditNota, abrirModalEdicion, notaEditando, registrarEventListener]);

  // ===================== CONFIGURACIÓN DE EVENTOS MEJORADA - CORREGIDO =====================
  const configurarEventosOverlay = useCallback(async () => {
    if (!overlayManager || !activo || !persistentRenderer) return;
    
    console.log('🎧 NotasLayer: Configurando eventos de overlay...');
    
    const paginas = await overlayManager.buscarPaginas();
    
    paginas.forEach((paginaElement, index) => {
      const numeroPagina = index + 1;
      const overlay = overlayManager.getOverlay(numeroPagina);
      
      if (overlay) {
        // Configurar evento de click para crear notas
        const handleClick = (e) => {
          // Evitar clicks en elementos existentes
          if (e.target.closest('.nota-icono') || 
              e.target.closest('.persistent-nota') ||
              e.target.closest('.modal-edicion-nota') ||
              e.target.closest('.nota-temporal')) {
            return;
          }
          
          handleLayerClick(e, overlay, numeroPagina);
        };
        
        // Usar OverlayManager para registro
        registrarEventListener(numeroPagina, overlay, 'mousedown', handleClick, { passive: false });
        
        // CORREGIDO: Configurar eventos para elementos persistentes existentes
        const notasExistentes = overlay.querySelectorAll('.persistent-nota');
        notasExistentes.forEach(notaElement => {
          const notaId = notaElement.getAttribute('data-nota-id');
          const nota = notas.find(n => n.id.toString() === notaId);
          
          if (nota && activo) {
            configurarEventosNota(notaElement, nota, numeroPagina); // CORREGIDO: función existe
          }
        });
        
        console.log(`🎧 NotasLayer: Eventos configurados para página ${numeroPagina}`);
      }
    });
  }, [overlayManager, activo, registrarEventListener, handleLayerClick, persistentRenderer, notas, configurarEventosNota]); // AGREGADO: configurarEventosNota

  // ===================== EFECTOS PRINCIPALES =====================

  // Efecto para configurar eventos cuando está activo
  useEffect(() => {
    if (visorInfo?.mode !== 'single' || !activo) return;
    
    console.log('📝 NotasLayer: Configurando eventos (activo)');
    configurarEventosOverlay();
  }, [activo, visorInfo?.mode, configurarEventosOverlay, overlaysCreados]);

  // ===================== MODO DUAL =====================
  
  if (visorInfo?.mode === 'dual') {
    // TODO: Implementar en próximo paso
    return null;
  }

  // ===================== RENDER =====================

  return (
    <div 
      ref={layerRef}
      className="notas-layer-manager"
      style={{ display: 'none' }}
      data-active={activo}
      data-elementos={elementosEnPaginaActual.length}
      data-overlays={overlaysCreados}
      data-temporal={!!notaTemporal}
      data-editando={!!notaEditando}
      data-persistent-renderer={!!persistentRenderer}
    />
  );
};

export default NotasLayer;
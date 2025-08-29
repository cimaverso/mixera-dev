// TextosLayer.jsx - PREPARADO PARA BACKEND v16
import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  console.log('💬 TextosLayer PREPARADO PARA BACKEND v16:', {
    activa: herramientaActiva === 'texto',
    paginaActual,
    cantidadTextos: textos.length,
    visorScale: visorInfo?.scale
  });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [textoEditando, setTextoEditando] = useState(null);
  const [guardandoTexto, setGuardandoTexto] = useState(false); // NUEVO: Estado de guardado
  const activo = herramientaActiva === 'texto';
  const overlaysRef = useRef(new Map());
  const eventosRef = useRef(new Map());

  // ===================== DETECTAR INFORMACIÓN REAL DEL PDF =====================
  
  const getPDFInfo = useCallback(() => {
    const page = document.querySelector('.rpv-core__inner-page');
    const canvas = document.querySelector('.rpv-core__canvas-layer canvas');
    const viewer = document.querySelector('.rpv-core__viewer');
    
    if (!page || !canvas) {
      console.warn('⚠️ No se encontró información del PDF');
      return { 
        pageWidth: 800, 
        pageHeight: 600, 
        scale: visorInfo?.scale || 1,
        found: false 
      };
    }
    
    const pageRect = page.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // El scale real es la diferencia entre el tamaño mostrado y el tamaño del canvas
    const actualScale = canvasRect.width / canvas.width;
    
    console.log('🔍 PDF Info detectado:', {
      pageDisplaySize: `${Math.round(pageRect.width)}x${Math.round(pageRect.height)}`,
      canvasNaturalSize: `${canvas.width}x${canvas.height}`,
      canvasDisplaySize: `${Math.round(canvasRect.width)}x${Math.round(canvasRect.height)}`,
      calculatedScale: actualScale.toFixed(3),
      visorInfoScale: visorInfo?.scale
    });
    
    return {
      pageWidth: pageRect.width,
      pageHeight: pageRect.height,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      scale: actualScale,
      found: true
    };
  }, [visorInfo?.scale]);

  // ===================== CREAR/OBTENER OVERLAY (SIN ZOOM COMPENSATION) =====================
  
  const getOverlay = useCallback((numeroPagina) => {
    let overlay = overlaysRef.current.get(numeroPagina);
    
    if (!overlay || !overlay.parentNode) {
      const paginas = document.querySelectorAll('.rpv-core__inner-page');
      const paginaElement = paginas[numeroPagina - 1];
      
      if (paginaElement) {
        overlay = document.createElement('div');
        overlay.className = 'texto-overlay-zoom-fixed';
        overlay.dataset.pagina = numeroPagina.toString();
        
        // CLAVE: El overlay debe cubrir exactamente la página, sin compensación de zoom
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
        `;
        
        if (getComputedStyle(paginaElement).position === 'static') {
          paginaElement.style.position = 'relative';
        }
        
        paginaElement.appendChild(overlay);
        overlaysRef.current.set(numeroPagina, overlay);
        
        console.log(`✅ Overlay zoom-fixed creado para página ${numeroPagina}`);
      }
    } else {
      overlay.style.pointerEvents = activo ? 'auto' : 'none';
      overlay.style.cursor = activo ? 'crosshair' : 'default';
    }
    
    return overlay;
  }, [activo]);

  // ===================== RENDERIZAR TEXTOS SIN COMPENSACIÓN DE ZOOM =====================
  
  const renderizarTextos = useCallback(() => {
    console.log('🎨 Renderizando textos SIN compensación de zoom...');
    
    const pdfInfo = getPDFInfo();
    
    // Limpiar textos huérfanos
    document.querySelectorAll('.texto-zoom-fixed').forEach(texto => {
      const textoId = texto.dataset.textoId;
      const textoExiste = textos.find(t => t.id.toString() === textoId);
      
      if (!textoExiste) {
        console.log(`🗑️ Removiendo texto huérfano: ${textoId}`);
        texto.remove();
      }
    });
    
    // Renderizar cada texto usando coordenadas RELATIVAS
    textos.forEach(texto => {
      const overlay = getOverlay(texto.pagina);
      if (!overlay) return;
      
      const textoId = texto.id.toString();
      let textoElement = overlay.querySelector(`[data-texto-id="${textoId}"]`);
      
      if (!textoElement) {
        // Crear elemento nuevo
        textoElement = document.createElement('div');
        textoElement.className = 'texto-zoom-fixed';
        textoElement.dataset.textoId = textoId;
        textoElement.dataset.pagina = texto.pagina.toString();
        
        // ESTRUCTURA SIMPLIFICADA que escala automáticamente
        textoElement.innerHTML = `
          <div class="texto-contenido" style="
            width: 100%;
            height: 100%;
            background: transparent;
            color: #1a1a1a;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: ${texto.fontSize || 14}px;
            font-weight: 500;
            padding: 8px 12px;
            border: 2px solid transparent;
            border-radius: 6px;
            box-sizing: border-box;
            word-wrap: break-word;
            white-space: pre-wrap;
            overflow: hidden;
            line-height: 1.4;
            text-shadow: 0 0 3px rgba(255,255,255,0.8);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            position: relative;
          ">${texto.texto}</div>
          <div class="resize-handles" style="display: none;">
            <div class="resize-handle resize-se" style="
              position: absolute;
              bottom: -4px;
              right: -4px;
              width: 12px;
              height: 12px;
              background: #2196f3;
              border: 2px solid white;
              border-radius: 50%;
              cursor: se-resize;
              z-index: 1000;
            "></div>
          </div>
        `;
        
        overlay.appendChild(textoElement);
        console.log(`🆕 Texto zoom-fixed creado: ${textoId}`);
      } else {
        // Actualizar contenido existente
        const contenido = textoElement.querySelector('.texto-contenido');
        if (contenido) {
          if (contenido.textContent !== texto.texto) {
            contenido.textContent = texto.texto;
          }
          // CRÍTICO: Actualizar también el tamaño de fuente
          const currentFontSize = contenido.style.fontSize;
          const newFontSize = `${texto.fontSize || 14}px`;
          if (currentFontSize !== newFontSize) {
            contenido.style.fontSize = newFontSize;
            console.log(`📏 Tamaño de fuente actualizado: ${textoId} -> ${newFontSize}`);
          }
          console.log(`🔄 Contenido actualizado: ${textoId}`);
        }
      }
      
      // CLAVE: Usar coordenadas RELATIVAS (porcentajes) y tamaños fijos en px
      // El CSS se encarga automáticamente del scaling con el zoom del PDF
      const width = texto.width || 200;
      const height = texto.height || 60;
      
      textoElement.style.cssText = `
        position: absolute;
        left: ${texto.x * 100}%;
        top: ${texto.y * 100}%;
        transform: translate(-50%, -50%);
        width: ${width}px;
        height: ${height}px;
        z-index: 210;
        cursor: pointer;
        pointer-events: ${activo ? 'auto' : 'none'};
        transition: all 0.2s ease;
        min-width: 100px;
        min-height: 40px;
        max-width: 500px;
        max-height: 400px;
      `;
      
      // ===================== CONFIGURAR EVENTOS SIN MULTIPLICAR POR ZOOM =====================
      
      if (activo) {
        // Limpiar eventos anteriores
        const eventosAnteriores = eventosRef.current.get(textoId);
        if (eventosAnteriores) {
          eventosAnteriores.forEach(cleanup => cleanup());
        }
        
        const cleanups = [];
        
        // HOVER EFFECTS
        const handleMouseEnter = () => {
          const contenido = textoElement.querySelector('.texto-contenido');
          const handles = textoElement.querySelector('.resize-handles');
          if (contenido) {
            contenido.style.background = 'rgba(33, 150, 243, 0.05)';
            contenido.style.borderColor = 'rgba(33, 150, 243, 0.3)';
            contenido.style.borderStyle = 'dashed';
            contenido.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.15)';
          }
          if (handles) {
            handles.style.display = 'block';
          }
        };
        
        const handleMouseLeave = () => {
          if (!textoElement.dataset.dragging && !textoElement.dataset.resizing) {
            const contenido = textoElement.querySelector('.texto-contenido');
            const handles = textoElement.querySelector('.resize-handles');
            if (contenido) {
              contenido.style.background = 'transparent';
              contenido.style.borderColor = 'transparent';
              contenido.style.borderStyle = 'solid';
              contenido.style.boxShadow = 'none';
            }
            if (handles) {
              handles.style.display = 'none';
            }
          }
        };
        
        // DRAG & DROP SIMPLIFICADO
        let isDragging = false;
        let startPos = { x: 0, y: 0 };
        let dragOffset = { x: 0, y: 0 };
        
        const handleMouseDown = (e) => {
          if (e.target.classList.contains('resize-handle')) return;
          if (e.button !== 0) return;
          
          e.stopPropagation();
          e.preventDefault();
          
          startPos = { x: e.clientX, y: e.clientY };
          
          // CLAVE: Calcular offset sin compensar por zoom
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
              textoElement.dataset.dragging = 'true';
              textoElement.style.opacity = '0.8';
              textoElement.style.zIndex = '300';
              console.log('🎯 Drag iniciado:', textoId);
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
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            if (isDragging) {
              // CLAVE: Calcular posición final en coordenadas relativas
              const finalOverlayRect = overlay.getBoundingClientRect();
              const finalTextoRect = textoElement.getBoundingClientRect();
              const finalCenterX = finalTextoRect.left + finalTextoRect.width / 2;
              const finalCenterY = finalTextoRect.top + finalTextoRect.height / 2;
              
              const finalX = (finalCenterX - finalOverlayRect.left) / finalOverlayRect.width;
              const finalY = (finalCenterY - finalOverlayRect.top) / finalOverlayRect.height;
              
              console.log('💾 Guardando nueva posición relativa:', { 
                id: texto.id, 
                x: finalX.toFixed(4), 
                y: finalY.toFixed(4) 
              });
              
              // MODIFICADO: Marcar como guardando mientras actualiza backend
              setGuardandoTexto(texto.id);
              
              onEditTexto({ 
                id: texto.id, 
                x: finalX, 
                y: finalY,
                texto: texto.texto,
                width: texto.width,
                height: texto.height,
                fontSize: texto.fontSize,
                pagina: texto.pagina
              }).then(() => {
                // Callback exitoso - el texto se guardó en backend
                console.log('✅ Posición guardada en backend:', texto.id);
                setGuardandoTexto(false);
              }).catch((error) => {
                console.error('❌ Error guardando posición:', error);
                setGuardandoTexto(false);
              });
              
              // Restaurar estilos
              textoElement.style.opacity = '1';
              textoElement.style.zIndex = '210';
              delete textoElement.dataset.dragging;
              
              isDragging = false;
            }
          };
          
          document.addEventListener('mousemove', handleMouseMove, { passive: false });
          document.addEventListener('mouseup', handleMouseUp, { passive: false });
          
          cleanups.push(() => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          });
        };
        
        // RESIZE SIMPLIFICADO
        const resizeHandle = textoElement.querySelector('.resize-se');
        if (resizeHandle) {
          let isResizing = false;
          let resizeStart = { x: 0, y: 0, width: 0, height: 0 };
          
          const handleResizeStart = (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            isResizing = true;
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
              
              // CLAVE: No compensar por zoom, usar valores directos
              const newWidth = Math.max(100, resizeStart.width + deltaX);
              const newHeight = Math.max(40, resizeStart.height + deltaY);
              
              textoElement.style.width = `${newWidth}px`;
              textoElement.style.height = `${newHeight}px`;
            };
            
            const handleResizeEnd = () => {
              if (isResizing) {
                const finalRect = textoElement.getBoundingClientRect();
                
                console.log('📏 Nuevo tamaño directo:', { 
                  width: finalRect.width, 
                  height: finalRect.height 
                });
                
                // MODIFICADO: Marcar como guardando mientras actualiza backend
                setGuardandoTexto(texto.id);
                
                onEditTexto({ 
                  id: texto.id, 
                  x: texto.x,
                  y: texto.y,
                  texto: texto.texto,
                  width: finalRect.width,
                  height: finalRect.height,
                  fontSize: texto.fontSize,
                  pagina: texto.pagina
                }).then(() => {
                  console.log('✅ Tamaño guardado en backend:', texto.id);
                  setGuardandoTexto(false);
                }).catch((error) => {
                  console.error('❌ Error guardando tamaño:', error);
                  setGuardandoTexto(false);
                });
                
                isResizing = false;
                delete textoElement.dataset.resizing;
                document.body.style.cursor = '';
              }
              
              document.removeEventListener('mousemove', handleResizeMove);
              document.removeEventListener('mouseup', handleResizeEnd);
            };
            
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
          };
          
          resizeHandle.addEventListener('mousedown', handleResizeStart);
          cleanups.push(() => {
            resizeHandle.removeEventListener('mousedown', handleResizeStart);
          });
        }
        
        // DOBLE CLICK PARA EDITAR
        const handleDoubleClick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          console.log('🖱️ Doble click en texto:', textoId);
          
          if (!modalAbierto && !guardandoTexto) {
            abrirModalEdicion(texto);
          }
        };
        
        // Registrar eventos principales
        textoElement.addEventListener('mousedown', handleMouseDown, { passive: false });
        textoElement.addEventListener('dblclick', handleDoubleClick, { passive: false });
        textoElement.addEventListener('mouseenter', handleMouseEnter);
        textoElement.addEventListener('mouseleave', handleMouseLeave);
        
        cleanups.push(() => {
          textoElement.removeEventListener('mousedown', handleMouseDown);
          textoElement.removeEventListener('dblclick', handleDoubleClick);
          textoElement.removeEventListener('mouseenter', handleMouseEnter);
          textoElement.removeEventListener('mouseleave', handleMouseLeave);
        });
        
        eventosRef.current.set(textoId, cleanups);
        console.log(`✅ Eventos configurados para texto: ${textoId}`);
      }
      
      // NUEVO: Indicador visual de guardado
      if (guardandoTexto === texto.id) {
        const indicadorGuardado = textoElement.querySelector('.indicador-guardado') || 
          document.createElement('div');
        
        if (!indicadorGuardado.classList.contains('indicador-guardado')) {
          indicadorGuardado.className = 'indicador-guardado';
          indicadorGuardado.innerHTML = '⏳';
          indicadorGuardado.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: rgba(255, 152, 0, 0.9);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            z-index: 1001;
            animation: pulse 1s infinite;
          `;
          textoElement.appendChild(indicadorGuardado);
        }
      } else {
        const indicadorExistente = textoElement.querySelector('.indicador-guardado');
        if (indicadorExistente) {
          indicadorExistente.remove();
        }
      }
    });
    
    console.log('✅ Renderizado completado SIN compensación de zoom');
  }, [textos, getOverlay, activo, onEditTexto, modalAbierto, getPDFInfo, guardandoTexto]);

  // ===================== MODAL CON CONTROLES DE TAMAÑO DE LETRA Y BACKEND =====================
  
  const crearModal = useCallback(({ titulo, valor = '', fontSize = 14, onGuardar, onCancelar, onEliminar }) => {
    if (modalAbierto || guardandoTexto) {
      console.warn('⚠️ Modal ya existe o hay texto guardando, ignorando');
      return;
    }
    
    console.log('🔧 Creando modal con controles de fuente:', titulo);
    
    // Limpiar modales anteriores
    document.querySelectorAll('.modal-texto-con-fuente').forEach(m => m.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal-texto-con-fuente';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      min-height: 400px;
      background: white;
      border: 2px solid #2196f3;
      border-radius: 12px;
      box-shadow: 0 15px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: inherit;
      display: flex;
      flex-direction: column;
    `;
    
    modal.innerHTML = `
      <div class="modal-header" style="
        background: linear-gradient(135deg, #2196f3, #1976d2);
        color: white;
        padding: 12px 16px;
        font-weight: 600;
        cursor: move;
        user-select: none;
        flex-shrink: 0;
        border-radius: 10px 10px 0 0;
        margin: -2px -2px 0 -2px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <span>${titulo}</span>
        <span style="font-size: 12px; opacity: 0.9;">📝 Editor de texto</span>
      </div>
      
      <div class="modal-body" style="
        flex: 1;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      ">
        <!-- Controles de formato -->
        <div class="font-controls" style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        ">
          <label style="font-size: 13px; font-weight: 600; color: #495057;">
            📏 Tamaño:
          </label>
          <input type="range" class="font-size-slider" 
                 min="10" max="24" step="1" value="${fontSize}"
                 style="
                   flex: 1;
                   height: 6px;
                   background: #ddd;
                   border-radius: 3px;
                   outline: none;
                   cursor: pointer;
                 ">
          <span class="font-size-display" style="
            font-size: 13px;
            font-weight: 600;
            color: #2196f3;
            min-width: 35px;
            text-align: center;
            background: white;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #2196f3;
          ">${fontSize}px</span>
        </div>

        <!-- Vista previa del texto -->
        <div class="text-preview" style="
          padding: 12px;
          border: 2px dashed #e0e0e0;
          border-radius: 8px;
          background: #fafafa;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div class="preview-content" style="
            font-size: ${fontSize}px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 500;
            color: #1a1a1a;
            text-align: center;
            line-height: 1.4;
            word-wrap: break-word;
            max-width: 100%;
            text-shadow: 0 0 3px rgba(255,255,255,0.8);
          ">
            ${valor || 'Vista previa del texto...'}
          </div>
        </div>

        <!-- Textarea principal -->
        <textarea class="modal-textarea" placeholder="Escribe tu texto aquí..." style="
          flex: 1;
          min-height: 120px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          font-family: inherit;
          line-height: 1.5;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s ease;
        ">${valor}</textarea>
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="modal-contador" style="font-size: 12px; color: #666;"></div>
          <div style="font-size: 11px; color: #999;">
            💡 Ctrl+Enter para guardar • Esc para cancelar
          </div>
        </div>
        
        <!-- NUEVO: Indicador de guardado -->
        <div class="modal-guardando" style="
          display: none;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid rgba(33, 150, 243, 0.3);
          border-radius: 6px;
          font-size: 13px;
          color: #1976d2;
        ">
          <div style="
            width: 16px;
            height: 16px;
            border: 2px solid #1976d2;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <span>Guardando en el servidor...</span>
        </div>
        
        <div style="
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          border-top: 1px solid #e0e0e0;
          padding-top: 12px;
        ">
          ${onEliminar ? '<button class="btn-eliminar" style="background: #f44336; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">🗑️ Eliminar</button>' : ''}
          <button class="btn-cancelar" style="background: #9e9e9e; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">❌ Cancelar</button>
          <button class="btn-guardar" style="background: #4caf50; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">💾 Guardar</button>
        </div>
      </div>
    `;
    
    // Agregar animación de spinner CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    const textarea = modal.querySelector('.modal-textarea');
    const contador = modal.querySelector('.modal-contador');
    const fontSlider = modal.querySelector('.font-size-slider');
    const fontDisplay = modal.querySelector('.font-size-display');
    const previewContent = modal.querySelector('.preview-content');
    const indicadorGuardando = modal.querySelector('.modal-guardando');
    const btnGuardar = modal.querySelector('.btn-guardar');
    const btnCancelar = modal.querySelector('.btn-cancelar');
    const btnEliminar = modal.querySelector('.btn-eliminar');
    
    let currentFontSize = fontSize;
    let guardandoEnProgreso = false;
    
    // Función para mostrar/ocultar indicador de guardado
    const mostrarGuardando = (mostrar) => {
      guardandoEnProgreso = mostrar;
      indicadorGuardando.style.display = mostrar ? 'flex' : 'none';
      btnGuardar.disabled = mostrar;
      btnCancelar.disabled = mostrar;
      if (btnEliminar) btnEliminar.disabled = mostrar;
      
      if (mostrar) {
        btnGuardar.style.opacity = '0.5';
        btnGuardar.textContent = 'Guardando...';
      } else {
        btnGuardar.style.opacity = '1';
        btnGuardar.textContent = '💾 Guardar';
      }
    };
    
    // Función para actualizar vista previa
    const actualizarVistaPrevia = () => {
      const texto = textarea.value.trim();
      previewContent.textContent = texto || 'Vista previa del texto...';
      previewContent.style.fontSize = `${currentFontSize}px`;
      
      // Cambiar color de la vista previa si no hay texto
      if (!texto) {
        previewContent.style.color = '#999';
        previewContent.style.fontStyle = 'italic';
      } else {
        previewContent.style.color = '#1a1a1a';
        previewContent.style.fontStyle = 'normal';
      }
    };
    
    // Contador de caracteres
    const actualizarContador = () => {
      const length = textarea.value.length;
      contador.textContent = `${length}/500 caracteres`;
      contador.style.color = length > 450 ? '#f44336' : '#666';
      
      actualizarVistaPrevia();
    };
    
    // Control del tamaño de fuente
    const actualizarTamañoFuente = (nuevoTamaño) => {
      currentFontSize = parseInt(nuevoTamaño);
      fontDisplay.textContent = `${currentFontSize}px`;
      actualizarVistaPrevia();
      
      console.log('📏 Tamaño de fuente cambiado a:', currentFontSize);
    };
    
    // Event listeners
    textarea.addEventListener('input', actualizarContador);
    fontSlider.addEventListener('input', (e) => actualizarTamañoFuente(e.target.value));
    
    // Botones de tamaño rápido
    const controlesTamaño = modal.querySelector('.font-controls');
    const botonesRapidos = document.createElement('div');
    botonesRapidos.style.cssText = `
      display: flex;
      gap: 4px;
      margin-left: 8px;
    `;
    
    [
      { label: 'S', size: 12, title: 'Pequeño' },
      { label: 'M', size: 14, title: 'Mediano' },
      { label: 'L', size: 18, title: 'Grande' },
      { label: 'XL', size: 22, title: 'Extra grande' }
    ].forEach(({ label, size, title }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.title = `${title} (${size}px)`;
      btn.style.cssText = `
        background: ${currentFontSize === size ? '#2196f3' : 'white'};
        color: ${currentFontSize === size ? 'white' : '#2196f3'};
        border: 1px solid #2196f3;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        transition: all 0.2s ease;
        min-width: 28px;
      `;
      
      btn.addEventListener('click', () => {
        if (guardandoEnProgreso) return;
        
        fontSlider.value = size;
        actualizarTamañoFuente(size);
        
        // Actualizar estilos de botones
        botonesRapidos.querySelectorAll('button').forEach(b => {
          const isActive = b === btn;
          b.style.background = isActive ? '#2196f3' : 'white';
          b.style.color = isActive ? 'white' : '#2196f3';
        });
      });
      
      btn.addEventListener('mouseenter', () => {
        if (currentFontSize !== size && !guardandoEnProgreso) {
          btn.style.background = '#e3f2fd';
        }
      });
      
      btn.addEventListener('mouseleave', () => {
        if (currentFontSize !== size) {
          btn.style.background = 'white';
        }
      });
      
      botonesRapidos.appendChild(btn);
    });
    
    controlesTamaño.appendChild(botonesRapidos);
    
    // Inicializar estados
    actualizarContador();
    
    // Focus styles
    textarea.addEventListener('focus', () => {
      if (!guardandoEnProgreso) {
        textarea.style.borderColor = '#2196f3';
        textarea.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.1)';
      }
    });
    
    textarea.addEventListener('blur', () => {
      textarea.style.borderColor = '#e0e0e0';
      textarea.style.boxShadow = 'none';
    });
    
    // Event handlers para botones principales - MODIFICADO CON BACKEND
    btnGuardar?.addEventListener('click', async () => {
      if (guardandoEnProgreso) return;
      
      const texto = textarea.value.trim();
      if (!texto) {
        alert('El texto no puede estar vacío');
        return;
      }
      
      try {
        mostrarGuardando(true);
        console.log('💾 Iniciando guardado en backend...');
        
        // CLAVE: onGuardar ahora retorna una Promise del backend
        await onGuardar(texto, currentFontSize);
        
        console.log('✅ Texto guardado exitosamente en backend');
        // Modal se cerrará automáticamente desde el callback del parent
        
      } catch (error) {
        console.error('❌ Error guardando texto:', error);
        mostrarGuardando(false);
        
        // Mostrar error al usuario
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = `
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid rgba(244, 67, 54, 0.3);
          border-radius: 6px;
          color: #d32f2f;
          font-size: 13px;
        `;
        errorMsg.textContent = `Error: ${error.message || 'No se pudo guardar el texto'}`;
        
        // Remover mensaje anterior si existe
        const errorAnterior = modal.querySelector('.error-message');
        if (errorAnterior) errorAnterior.remove();
        
        errorMsg.className = 'error-message';
        modal.querySelector('.modal-body').insertBefore(errorMsg, modal.querySelector('.modal-body').lastElementChild);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
          if (errorMsg.parentNode) errorMsg.remove();
        }, 5000);
      }
    });
    
    btnCancelar?.addEventListener('click', () => {
      if (guardandoEnProgreso) {
        const confirmar = confirm('Hay una operación de guardado en progreso. ¿Cancelar de todas formas?');
        if (!confirmar) return;
      }
      onCancelar();
    });
    
    btnEliminar?.addEventListener('click', async () => {
      if (guardandoEnProgreso) {
        alert('Espera a que termine de guardarse antes de eliminar');
        return;
      }
      
      const confirmar = confirm('¿Estás seguro de que quieres eliminar este texto?');
      if (!confirmar) return;
      
      try {
        mostrarGuardando(true);
        console.log('🗑️ Iniciando eliminación en backend...');
        
        // CLAVE: onEliminar ahora retorna una Promise del backend
        await onEliminar();
        
        console.log('✅ Texto eliminado exitosamente del backend');
        // Modal se cerrará automáticamente
        
      } catch (error) {
        console.error('❌ Error eliminando texto:', error);
        mostrarGuardando(false);
        alert(`Error eliminando texto: ${error.message || 'Error desconocido'}`);
      }
    });
    
    // Keyboard shortcuts mejorados - MODIFICADO PARA BACKEND
    textarea.addEventListener('keydown', async (e) => {
      if (guardandoEnProgreso) {
        if (e.key === 'Escape') {
          e.preventDefault();
          return;
        }
        return; // Ignorar otras teclas mientras guarda
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelar();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        const texto = textarea.value.trim();
        if (texto) {
          // Simular click en guardar
          btnGuardar.click();
        }
      } else if (e.key === '=' && e.ctrlKey) {
        e.preventDefault();
        const nuevoTamaño = Math.min(24, currentFontSize + 1);
        fontSlider.value = nuevoTamaño;
        actualizarTamañoFuente(nuevoTamaño);
      } else if (e.key === '-' && e.ctrlKey) {
        e.preventDefault();
        const nuevoTamaño = Math.max(10, currentFontSize - 1);
        fontSlider.value = nuevoTamaño;
        actualizarTamañoFuente(nuevoTamaño);
      }
    });
    
    // Estilos hover para botones
    modal.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        if (!btn.disabled && !btn.textContent.match(/^[SMLX]+$/)) { 
          btn.style.transform = 'translateY(-1px)';
          btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        }
      });
      
      btn.addEventListener('mouseleave', () => {
        if (!btn.textContent.match(/^[SMLX]+$/)) {
          btn.style.transform = 'translateY(0)';
          btn.style.boxShadow = 'none';
        }
      });
    });
    
    // Prevenir cierre accidental durante guardado
    const handleBeforeUnload = (e) => {
      if (guardandoEnProgreso) {
        e.preventDefault();
        e.returnValue = 'Hay una operación de guardado en progreso';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup cuando se cierre el modal
    const cleanup = () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    
    // Almacenar cleanup para uso posterior
    modal.cleanup = cleanup;
    
    document.body.appendChild(modal);
    setModalAbierto(true);
    
    // Focus con delay
    setTimeout(() => {
      if (!guardandoEnProgreso) {
        textarea.focus();
        if (valor) {
          textarea.select();
        }
      }
    }, 100);
    
    return modal;
  }, [modalAbierto, guardandoTexto]);

  // ===================== CREAR TEXTO TEMPORAL CON BACKEND =====================
  
  const crearTextoTemporal = useCallback((overlay, x, y, numeroPagina) => {
    console.log('💬 Creando texto temporal:', { numeroPagina, x, y });
    
    const modal = crearModal({
      titulo: `Nuevo texto - Página ${numeroPagina}`,
      fontSize: 14,
      onGuardar: async (texto, fontSize) => {
        console.log('💾 Guardando nuevo texto en backend:', { texto, fontSize, x, y, numeroPagina });
        
        // CLAVE: Retornar la Promise para que el modal pueda manejar el estado de guardado
        return new Promise((resolve, reject) => {
          onAddTexto({ 
            pagina: numeroPagina, 
            x, 
            y, 
            texto, 
            width: 200,
            height: 60,
            fontSize: fontSize || 14
          })
          .then(() => {
            // Éxito - cerrar modal
            if (modal && modal.cleanup) modal.cleanup();
            document.querySelector('.modal-texto-con-fuente')?.remove();
            setModalAbierto(false);
            onDesactivarHerramienta();
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
        });
      },
      onCancelar: () => {
        if (modal && modal.cleanup) modal.cleanup();
        document.querySelector('.modal-texto-con-fuente')?.remove();
        setModalAbierto(false);
        onDesactivarHerramienta();
      }
    });
  }, [onAddTexto, onDesactivarHerramienta, crearModal]);

  // ===================== EDITAR TEXTO CON BACKEND =====================
  
  const abrirModalEdicion = useCallback((texto) => {
    console.log('✏️ Editando texto:', texto.id);
    
    setTextoEditando(texto.id);
    
    const modal = crearModal({
      titulo: `Editar texto - Página ${texto.pagina}`,
      valor: texto.texto,
      fontSize: texto.fontSize || 14,
      onGuardar: async (nuevoTexto, fontSize) => {
        console.log('💾 Guardando edición en backend:', { id: texto.id, nuevoTexto, fontSize });
        
        return new Promise((resolve, reject) => {
          onEditTexto({ 
            id: texto.id, 
            texto: nuevoTexto,
            x: texto.x,
            y: texto.y,
            width: texto.width,
            height: texto.height,
            pagina: texto.pagina,
            fontSize: fontSize || 14
          })
          .then(() => {
            // Éxito - cerrar modal
            if (modal && modal.cleanup) modal.cleanup();
            document.querySelector('.modal-texto-con-fuente')?.remove();
            setModalAbierto(false);
            setTextoEditando(null);
            onDesactivarHerramienta();
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
        });
      },
      onCancelar: () => {
        if (modal && modal.cleanup) modal.cleanup();
        document.querySelector('.modal-texto-con-fuente')?.remove();
        setModalAbierto(false);
        setTextoEditando(null);
      },
      onEliminar: async () => {
        return new Promise((resolve, reject) => {
          onDeleteTexto(texto.id)
          .then(() => {
            // Éxito - cerrar modal
            if (modal && modal.cleanup) modal.cleanup();
            document.querySelector('.modal-texto-con-fuente')?.remove();
            setModalAbierto(false);
            setTextoEditando(null);
            onDesactivarHerramienta();
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
        });
      }
    });
  }, [onEditTexto, onDeleteTexto, onDesactivarHerramienta, crearModal]);

  // ===================== CONFIGURAR EVENTOS DE OVERLAY =====================
  
  const configurarEventosOverlay = useCallback(async () => {
    if (!activo) return;
    
    console.log('🎧 Configurando eventos de overlay...');
    
    const buscarPaginas = () => {
      const selectores = [
        '.rpv-core__inner-page',
        '[data-testid="core__page-layer"]',
        '.dual-page canvas'
      ];
      
      for (const selector of selectores) {
        const paginas = document.querySelectorAll(selector);
        if (paginas.length > 0) {
          return Array.from(paginas);
        }
      }
      return [];
    };
    
    const paginas = buscarPaginas();
    
    paginas.forEach((paginaElement, index) => {
      const numeroPagina = index + 1;
      const overlay = getOverlay(numeroPagina);
      
      if (overlay) {
        // Limpiar eventos anteriores
        const nuevoOverlay = overlay.cloneNode(false);
        overlay.parentNode.replaceChild(nuevoOverlay, overlay);
        overlaysRef.current.set(numeroPagina, nuevoOverlay);
        
        // Configurar click para crear texto
        const handleClick = (e) => {
          if (e.target.closest('.texto-zoom-fixed') || modalAbierto || guardandoTexto) return;
          
          const rect = nuevoOverlay.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          
          if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
            crearTextoTemporal(nuevoOverlay, x, y, numeroPagina);
          }
        };
        
        nuevoOverlay.addEventListener('mousedown', handleClick, { passive: false });
        console.log(`✅ Overlay configurado para página ${numeroPagina}`);
      }
    });
    
    // Renderizar textos después de configurar overlays
    setTimeout(() => {
      renderizarTextos();
    }, 100);
    
  }, [activo, getOverlay, crearTextoTemporal, modalAbierto, renderizarTextos, guardandoTexto]);

  // ===================== EFECTOS =====================

  // Configurar cuando está activo
  useEffect(() => {
    if (visorInfo?.mode !== 'single') return;
    
    if (activo) {
      console.log('🔄 Herramienta ACTIVA - configurando');
      configurarEventosOverlay();
    } else {
      console.log('🔄 Herramienta INACTIVA - limpiando');
      
      // Limpiar eventos
      eventosRef.current.forEach(cleanups => {
        cleanups.forEach(cleanup => cleanup());
      });
      eventosRef.current.clear();
      
      // Limpiar modales
      document.querySelectorAll('.modal-texto-con-fuente').forEach(modal => {
        if (modal.cleanup) modal.cleanup();
        modal.remove();
      });
      
      setModalAbierto(false);
      setTextoEditando(null);
      setGuardandoTexto(false);
    }
  }, [activo, visorInfo?.mode, configurarEventosOverlay]);

  // Re-renderizar cuando cambien los textos
  useEffect(() => {
    if (activo && visorInfo?.mode === 'single') {
      console.log('🔄 Textos cambiaron, re-renderizando');
      setTimeout(() => {
        renderizarTextos();
      }, 10);
    }
  }, [textos, activo, visorInfo?.mode, renderizarTextos]);

  // Observer para detectar cambios de zoom del PDF
  useEffect(() => {
    if (!activo || visorInfo?.mode !== 'single') return;
    
    console.log('🔍 Configurando observer para cambios de zoom...');
    
    let lastScale = visorInfo?.scale || 1;
    let timeoutId = null;
    
    const checkScaleChange = () => {
      const pdfInfo = getPDFInfo();
      const currentScale = pdfInfo.scale;
      
      if (Math.abs(currentScale - lastScale) > 0.05) {
        console.log(`🔍 Cambio de escala detectado: ${lastScale.toFixed(3)} → ${currentScale.toFixed(3)}`);
        lastScale = currentScale;
        
        // Debounce para evitar múltiples re-renders
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          console.log('🎨 Re-renderizando por cambio de escala...');
          renderizarTextos();
        }, 150);
      }
    };
    
    // Observer para el contenedor del PDF
    let observer = null;
    const setupObserver = () => {
      const targetElements = [
        document.querySelector('.rpv-core__viewer'),
        document.querySelector('.rpv-core__inner-pages'),
        document.querySelector('.rpv-core__inner-page')
      ].filter(Boolean);
      
      if (targetElements.length > 0) {
        observer = new MutationObserver((mutations) => {
          let shouldCheck = false;
          mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'style' || 
                 mutation.attributeName === 'transform')) {
              shouldCheck = true;
            }
          });
          
          if (shouldCheck) {
            checkScaleChange();
          }
        });
        
        targetElements.forEach(element => {
          observer.observe(element, {
            attributes: true,
            attributeFilter: ['style', 'transform', 'class'],
            subtree: false
          });
        });
        
        console.log(`✅ Observer configurado en ${targetElements.length} elementos`);
      }
    };
    
    // ResizeObserver para canvas y páginas
    let resizeObserver = null;
    const setupResizeObserver = () => {
      const canvasElements = [
        document.querySelector('.rpv-core__canvas-layer canvas'),
        document.querySelector('.rpv-core__inner-page')
      ].filter(Boolean);
      
      if (canvasElements.length > 0) {
        resizeObserver = new ResizeObserver(() => {
          checkScaleChange();
        });
        
        canvasElements.forEach(element => {
          resizeObserver.observe(element);
        });
        
        console.log(`✅ ResizeObserver configurado en ${canvasElements.length} elementos`);
      }
    };
    
    // Polling como backup
    const pollingInterval = setInterval(checkScaleChange, 2000);
    
    // Configurar observers
    setupObserver();
    setupResizeObserver();
    
    // Check inicial después de un delay
    setTimeout(checkScaleChange, 500);
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      clearInterval(pollingInterval);
      console.log('🧹 Limpieza de observers completada');
    };
  }, [activo, visorInfo?.mode, visorInfo?.scale, renderizarTextos, getPDFInfo]);

  // ===================== RENDER =====================

  return (
    <div 
      style={{ display: 'none' }}
      data-active={activo}
      data-elementos={textos.length}
      data-modal-abierto={modalAbierto}
      data-guardando={guardandoTexto}
      data-version="backend-ready-v16"
      data-pdf-scale={visorInfo?.scale?.toFixed(3) || 'unknown'}
    />
  );
};

export default TextosLayer;
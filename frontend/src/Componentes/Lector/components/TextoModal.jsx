// TextoModal.jsx - OPTIMIZADO PARA UX Y ESCALADO v2
import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * TextoModal optimizado con:
 * - Mejor integración con sistema de escalado
 * - UX mejorada para redimensionamiento
 * - Preview en tiempo real con escalado correcto
 * - Controles más intuitivos
 * - Mejor feedback de backend
 */
const TextoModal = ({
  isOpen,
  titulo = 'Configurar Texto',
  valor = '',
  fontSize = 14,
  width = 200,
  height = 60,
  currentPDFScale = 1,
  onGuardar,
  onCancelar,
  onEliminar = null,
  showBackendStatus = false
}) => {
  console.log('TextoModal optimizado v2:', {
    isOpen,
    currentPDFScale: currentPDFScale.toFixed(2),
    dimensionesIniciales: `${width}x${height}`,
    fontSize
  });

  // ===================== ESTADO LOCAL =====================
  const [texto, setTexto] = useState(valor);
  const [tamanoFuente, setTamanoFuente] = useState(fontSize);
  const [dimensiones, setDimensiones] = useState({ width, height });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Referencias para elementos
  const modalRef = useRef(null);
  const previewRef = useRef(null);
  const textareaRef = useRef(null);

  // ===================== CONFIGURACIÓN MODAL =====================
  const MODAL_CONFIG = {
    minWidth: 400,
    maxWidth: Math.min(800, window.innerWidth - 40),
    minHeight: 500,
    maxHeight: Math.min(700, window.innerHeight - 40),
    defaultWidth: 500,
    defaultHeight: 600
  };

  // Configuración de dimensiones del texto
  const TEXTO_CONFIG = {
    minWidth: 80,
    maxWidth: 600,
    minHeight: 30,
    maxHeight: 400,
    minFontSize: 10,
    maxFontSize: 24
  };

  // ===================== INICIALIZACIÓN =====================
  
  // Estado inicial del modal
  useEffect(() => {
    if (isOpen) {
      setTexto(valor);
      setTamanoFuente(fontSize);
      setDimensiones({ width, height });
      setError(null);
      setGuardando(false);
      
      // Centrar modal
      if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        const centerX = (window.innerWidth - rect.width) / 2;
        const centerY = (window.innerHeight - rect.height) / 2;
        
        setModalPosition({
          x: Math.max(10, centerX),
          y: Math.max(10, centerY)
        });
      }
      
      console.log('Modal inicializado:', {
        texto: valor.substring(0, 30) + '...',
        dimensiones: `${width}x${height}`,
        fontSize
      });
    }
  }, [isOpen, valor, fontSize, width, height]);

  // Auto-focus en textarea cuando se abre
  useEffect(() => {
    if (isOpen && textareaRef.current && !guardando) {
      const timer = setTimeout(() => {
        textareaRef.current.focus();
        if (valor) {
          textareaRef.current.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, guardando, valor]);

  // ===================== CÁLCULOS DE ESCALADO =====================
  
  // Dimensiones escaladas para preview
  const dimensionesEscaladas = React.useMemo(() => {
    const scaledWidth = Math.round(dimensiones.width * currentPDFScale);
    const scaledHeight = Math.round(dimensiones.height * currentPDFScale);
    const scaledFontSize = Math.round(tamanoFuente * currentPDFScale);
    
    return {
      width: Math.max(Math.round(TEXTO_CONFIG.minWidth * currentPDFScale), scaledWidth),
      height: Math.max(Math.round(TEXTO_CONFIG.minHeight * currentPDFScale), scaledHeight),
      fontSize: Math.max(Math.round(TEXTO_CONFIG.minFontSize * currentPDFScale), scaledFontSize)
    };
  }, [dimensiones, tamanoFuente, currentPDFScale, TEXTO_CONFIG]);

  // ===================== FUNCIONES DE DRAG =====================
  
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.modal-header') && 
        !e.target.closest('.modal-close-btn') && 
        !e.target.closest('.modal-resize-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      });
      e.preventDefault();
    }
  }, [modalPosition]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(
        window.innerWidth - MODAL_CONFIG.defaultWidth, 
        e.clientX - dragStart.x
      ));
      const newY = Math.max(0, Math.min(
        window.innerHeight - MODAL_CONFIG.defaultHeight, 
        e.clientY - dragStart.y
      ));
      
      setModalPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragStart, MODAL_CONFIG]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ===================== FUNCIONES DE RESIZE DEL MODAL =====================
  
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    const rect = modalRef.current.getBoundingClientRect();
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    });
    
    document.body.style.cursor = 'se-resize';
  }, []);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const newWidth = Math.max(
      MODAL_CONFIG.minWidth,
      Math.min(MODAL_CONFIG.maxWidth, resizeStart.width + deltaX)
    );
    
    const newHeight = Math.max(
      MODAL_CONFIG.minHeight,
      Math.min(MODAL_CONFIG.maxHeight, resizeStart.height + deltaY)
    );
    
    if (modalRef.current) {
      modalRef.current.style.width = `${newWidth}px`;
      modalRef.current.style.height = `${newHeight}px`;
    }
  }, [isResizing, resizeStart, MODAL_CONFIG]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
  }, []);

  // Event listeners para drag y resize
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // ===================== FUNCIONES DE CONTROL =====================
  
  const handleTamanoFuenteChange = useCallback((nuevoTamano) => {
    const tamanoValido = Math.max(
      TEXTO_CONFIG.minFontSize,
      Math.min(TEXTO_CONFIG.maxFontSize, nuevoTamano)
    );
    setTamanoFuente(tamanoValido);
  }, [TEXTO_CONFIG]);

  const handleDimensionesChange = useCallback((nuevasDimensiones) => {
    const dimensionesValidas = {
      width: Math.max(
        TEXTO_CONFIG.minWidth,
        Math.min(TEXTO_CONFIG.maxWidth, nuevasDimensiones.width)
      ),
      height: Math.max(
        TEXTO_CONFIG.minHeight,
        Math.min(TEXTO_CONFIG.maxHeight, nuevasDimensiones.height)
      )
    };
    
    setDimensiones(dimensionesValidas);
  }, [TEXTO_CONFIG]);

  // ===================== FUNCIONES DE ACCIÓN =====================
  
  const handleGuardar = useCallback(async () => {
    if (guardando) return;
    
    const textoTrimmed = texto.trim();
    if (!textoTrimmed) {
      setError('El texto no puede estar vacío');
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      
      console.log('Modal guardando con dimensiones optimizadas:', {
        texto: textoTrimmed.substring(0, 30) + '...',
        tamanoFuente,
        dimensiones,
        dimensionesEscaladas
      });

      await onGuardar(textoTrimmed, tamanoFuente, dimensiones.width, dimensiones.height);
      
      console.log('Modal: guardado exitoso');
      
    } catch (backendError) {
      console.error('Modal: error del backend:', backendError);
      setError(backendError.message || 'Error guardando en el servidor');
      setGuardando(false);
    }
  }, [texto, tamanoFuente, dimensiones, onGuardar, guardando, dimensionesEscaladas]);

  const handleEliminar = useCallback(async () => {
    if (guardando) {
      setError('Espera a que termine de guardarse antes de eliminar');
      return;
    }

    const confirmar = confirm('¿Estás seguro de que quieres eliminar este texto?');
    if (!confirmar) return;

    try {
      setGuardando(true);
      setError(null);
      
      console.log('Modal eliminando');
      await onEliminar();
      console.log('Modal: eliminado exitoso');
      
    } catch (backendError) {
      console.error('Modal: error eliminando:', backendError);
      setError(backendError.message || 'Error eliminando del servidor');
      setGuardando(false);
    }
  }, [onEliminar, guardando]);

  const handleCancelar = useCallback(() => {
    if (guardando) {
      const confirmar = confirm('Hay una operación en progreso. ¿Cancelar de todas formas?');
      if (!confirmar) return;
    }
    
    console.log('Modal: cancelando operación');
    onCancelar();
  }, [onCancelar, guardando]);

  // ===================== KEYBOARD SHORTCUTS =====================
  
  const handleKeyDown = useCallback((e) => {
    if (guardando && e.key !== 'Escape') return;
    
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelar();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (texto.trim() && !guardando) {
        handleGuardar();
      }
    }
  }, [handleCancelar, handleGuardar, texto, guardando]);

  // No renderizar si no está abierto
  if (!isOpen) return null;

  return (
    <>
      {/* CSS para animaciones */}
      <style>
        {`
          @keyframes modal-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes modal-pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
            100% { opacity: 1; transform: scale(1); }
          }
          
          .modal-resize-handle {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            background: linear-gradient(-45deg, transparent 0%, transparent 40%, #ccc 50%, transparent 60%, transparent 100%);
            cursor: se-resize;
            border-radius: 0 0 12px 0;
          }
          
          .modal-resize-handle:hover {
            background: linear-gradient(-45deg, transparent 0%, transparent 40%, #2196f3 50%, transparent 60%, transparent 100%);
          }
        `}
      </style>

      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          backdropFilter: 'blur(2px)'
        }}
        onClick={handleCancelar}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="modal-texto-optimizado"
        style={{
          position: 'fixed',
          left: `${modalPosition.x}px`,
          top: `${modalPosition.y}px`,
          width: `${MODAL_CONFIG.defaultWidth}px`,
          height: `${MODAL_CONFIG.defaultHeight}px`,
          minWidth: `${MODAL_CONFIG.minWidth}px`,
          minHeight: `${MODAL_CONFIG.minHeight}px`,
          maxWidth: `${MODAL_CONFIG.maxWidth}px`,
          maxHeight: `${MODAL_CONFIG.maxHeight}px`,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'inherit',
          border: '1px solid #e0e0e0',
          resize: 'both'
        }}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header movible */}
        <div 
          className="modal-header"
          style={{
            background: 'linear-gradient(135deg, #2196f3, #1976d2)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '12px 12px 0 0',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            flexShrink: 0,
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{titulo}</span>
            {currentPDFScale !== 1 && (
              <span style={{ 
                fontSize: '11px', 
                opacity: 0.8,
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 6px',
                borderRadius: '3px'
              }}>
                Zoom: {Math.round(currentPDFScale * 100)}%
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showBackendStatus && (
              <span style={{ 
                fontSize: '12px', 
                opacity: 0.9,
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                Backend Ready
              </span>
            )}
            <button
              className="modal-close-btn"
              onClick={handleCancelar}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                lineHeight: 1,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              ×
            </button>
          </div>
          
          {/* Handle de resize en header */}
          <div 
            className="modal-resize-handle"
            onMouseDown={handleResizeStart}
          />
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'auto'
        }}>
          {/* Controles de fuente y dimensiones */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            flexShrink: 0
          }}>
            {/* Control de tamaño de fuente */}
            <div style={{
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <label style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#495057',
                display: 'block',
                marginBottom: '8px'
              }}>
                Tamaño de Fuente
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="range" 
                  min={TEXTO_CONFIG.minFontSize} 
                  max={TEXTO_CONFIG.maxFontSize} 
                  step="1" 
                  value={tamanoFuente}
                  disabled={guardando}
                  onChange={(e) => handleTamanoFuenteChange(parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    height: '6px',
                    background: '#ddd',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: guardando ? 'not-allowed' : 'pointer'
                  }}
                />
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2196f3',
                  minWidth: '35px',
                  textAlign: 'center',
                  background: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #2196f3'
                }}>
                  {tamanoFuente}px
                </span>
              </div>
            </div>

            {/* Control de dimensiones */}
            <div style={{
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <label style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#495057',
                display: 'block',
                marginBottom: '8px'
              }}>
                Dimensiones (Base)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min={TEXTO_CONFIG.minWidth}
                    max={TEXTO_CONFIG.maxWidth}
                    value={dimensiones.width}
                    disabled={guardando}
                    onChange={(e) => handleDimensionesChange({
                      ...dimensiones,
                      width: parseInt(e.target.value) || TEXTO_CONFIG.minWidth
                    })}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}
                  />
                  <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', marginTop: '2px' }}>
                    Ancho
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min={TEXTO_CONFIG.minHeight}
                    max={TEXTO_CONFIG.maxHeight}
                    value={dimensiones.height}
                    disabled={guardando}
                    onChange={(e) => handleDimensionesChange({
                      ...dimensiones,
                      height: parseInt(e.target.value) || TEXTO_CONFIG.minHeight
                    })}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}
                  />
                  <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', marginTop: '2px' }}>
                    Alto
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa escalada */}
          <div style={{
            flexShrink: 0,
            border: '2px dashed #e0e0e0',
            borderRadius: '8px',
            background: '#fafafa',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#495057',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Vista Previa (Como se verá en el PDF)</span>
              <span style={{
                fontSize: '11px',
                color: '#2196f3',
                background: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid #2196f3'
              }}>
                {dimensionesEscaladas.width}×{dimensionesEscaladas.height}px
              </span>
            </div>
            
            <div
              ref={previewRef}
              style={{
                width: `${Math.min(400, dimensionesEscaladas.width)}px`,
                height: `${Math.min(200, dimensionesEscaladas.height)}px`,
                maxWidth: '100%',
                border: '2px solid rgba(33, 150, 243, 0.3)',
                borderStyle: 'dashed',
                borderRadius: '6px',
                background: 'rgba(33, 150, 243, 0.05)',
                boxShadow: '0 2px 8px rgba(33, 150, 243, 0.15)',
                padding: `${Math.round(8 * currentPDFScale)}px ${Math.round(12 * currentPDFScale)}px`,
                fontSize: `${dimensionesEscaladas.fontSize}px`,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 500,
                color: texto.trim() ? '#1a1a1a' : '#999',
                fontStyle: texto.trim() ? 'normal' : 'italic',
                lineHeight: 1.4,
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                textShadow: '0 0 3px rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                overflow: 'hidden',
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >
              {texto.trim() || 'Escribe tu texto para ver la vista previa...'}
              
              {/* Indicador de escala */}
              {currentPDFScale !== 1 && (
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'rgba(33, 150, 243, 0.8)',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontFamily: 'monospace'
                }}>
                  {Math.round(currentPDFScale * 100)}%
                </div>
              )}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe tu texto aquí..."
            disabled={guardando}
            autoFocus={!guardando}
            style={{
              flex: 1,
              minHeight: '120px',
              maxHeight: '200px',
              border: error ? '2px solid #f44336' : '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none',
              opacity: guardando ? 0.6 : 1,
              cursor: guardando ? 'not-allowed' : 'text',
              transition: 'border-color 0.2s ease, opacity 0.2s ease'
            }}
            onFocus={(e) => {
              if (!error) e.target.style.borderColor = '#2196f3';
            }}
            onBlur={(e) => {
              if (!error) e.target.style.borderColor = '#e0e0e0';
            }}
          />

          {/* Estados de backend */}
          {guardando && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#1976d2',
              flexShrink: 0,
              animation: 'modal-pulse 2s infinite'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #1976d2',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'modal-spin 1s linear infinite'
              }} />
              <span>Procesando en servidor...</span>
              <div style={{
                marginLeft: 'auto',
                fontSize: '11px',
                opacity: 0.8
              }}>
                Dimensiones: {dimensiones.width}×{dimensiones.height}px
              </div>
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#d32f2f',
              flexShrink: 0
            }}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Botones */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            borderTop: '1px solid #e0e0e0',
            paddingTop: '12px',
            flexShrink: 0
          }}>
            {onEliminar && (
              <button 
                onClick={handleEliminar}
                disabled={guardando}
                style={{
                  background: guardando ? '#ccc' : '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  opacity: guardando ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  if (!guardando) e.target.style.background = '#d32f2f';
                }}
                onMouseLeave={(e) => {
                  if (!guardando) e.target.style.background = '#f44336';
                }}
              >
                Eliminar
              </button>
            )}
            <button 
              onClick={handleCancelar}
              disabled={guardando}
              style={{
                background: guardando ? '#ccc' : '#9e9e9e',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                cursor: guardando ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                opacity: guardando ? 0.6 : 1,
                transition: 'all 0.2s ease',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (!guardando) e.target.style.background = '#757575';
              }}
              onMouseLeave={(e) => {
                if (!guardando) e.target.style.background = '#9e9e9e';
              }}
            >
              Cancelar
            </button>
            <button 
              onClick={handleGuardar}
              disabled={guardando || !texto.trim()}
              style={{
                background: (guardando || !texto.trim()) ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: (guardando || !texto.trim()) ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                opacity: (guardando || !texto.trim()) ? 0.6 : 1,
                transition: 'all 0.2s ease',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (!guardando && texto.trim()) e.target.style.background = '#45a049';
              }}
              onMouseLeave={(e) => {
                if (!guardando && texto.trim()) e.target.style.background = '#4caf50';
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TextoModal;
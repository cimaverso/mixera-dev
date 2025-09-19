// TextoModal.jsx - VERSIÓN ROBUSTA CORREGIDA
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
  // ===================== ESTADO LOCAL =====================
  const [texto, setTexto] = useState(valor);
  const [tamanoFuente, setTamanoFuente] = useState(fontSize);
  const [dimensiones, setDimensiones] = useState({ width, height });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  
  // Referencias
  const modalRef = useRef(null);
  const textareaRef = useRef(null);
  const mountedRef = useRef(true);

  // ===================== CONFIGURACIÓN =====================
  const CONFIG = useMemo(() => ({
    MODAL: {
      MIN_WIDTH: 400,
      MAX_WIDTH: 600,
      MIN_HEIGHT: 500,
      MAX_HEIGHT: 700,
      DEFAULT_WIDTH: 520,
      DEFAULT_HEIGHT: 600
    },
    TEXTO: {
      MIN_WIDTH: 100,
      MAX_WIDTH: 600,
      MIN_HEIGHT: 40,
      MAX_HEIGHT: 300,
      MIN_FONT_SIZE: 10,
      MAX_FONT_SIZE: 32
    }
  }), []);

  // ===================== VALIDACIONES =====================
  const validarEscala = useCallback((scale) => {
    return Math.max(0.5, Math.min(3.0, scale || 1));
  }, []);

  const escalaSegura = useMemo(() => {
    return validarEscala(currentPDFScale);
  }, [currentPDFScale, validarEscala]);

  const validarDimensiones = useCallback((w, h, fs) => {
    const validWidth = Math.max(CONFIG.TEXTO.MIN_WIDTH, Math.min(CONFIG.TEXTO.MAX_WIDTH, w || 200));
    const validHeight = Math.max(CONFIG.TEXTO.MIN_HEIGHT, Math.min(CONFIG.TEXTO.MAX_HEIGHT, h || 60));
    const validFontSize = Math.max(CONFIG.TEXTO.MIN_FONT_SIZE, Math.min(CONFIG.TEXTO.MAX_FONT_SIZE, fs || 14));
    
    return { width: validWidth, height: validHeight, fontSize: validFontSize };
  }, [CONFIG.TEXTO]);

  // ===================== DIMENSIONES ESCALADAS PARA PREVIEW =====================
  const dimensionesPreview = useMemo(() => {
    const valid = validarDimensiones(dimensiones.width, dimensiones.height, tamanoFuente);
    
    return {
      base: valid,
      scaled: {
        width: Math.round(valid.width * escalaSegura),
        height: Math.round(valid.height * escalaSegura),
        fontSize: Math.round(valid.fontSize * escalaSegura),
        padding: Math.round(8 * escalaSegura)
      },
      factor: escalaSegura
    };
  }, [dimensiones, tamanoFuente, escalaSegura, validarDimensiones]);

  // ===================== INICIALIZACIÓN =====================
  useEffect(() => {
    mountedRef.current = true;
    
    if (isOpen) {
      setTexto(valor);
      setTamanoFuente(fontSize);
      setDimensiones({ width, height });
      setError(null);
      setGuardando(false);
      
      // Auto-focus con delay
      setTimeout(() => {
        if (textareaRef.current && mountedRef.current) {
          textareaRef.current.focus();
          if (valor) {
            textareaRef.current.select();
          }
        }
      }, 150);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [isOpen, valor, fontSize, width, height]);

  // ===================== HANDLERS PRINCIPALES =====================
  const handleGuardar = useCallback(async () => {
    if (guardando || !mountedRef.current) return;
    
    const textoTrimmed = texto.trim();
    if (!textoTrimmed) {
      setError('El texto no puede estar vacío');
      return;
    }

    // Validar dimensiones antes de guardar
    const dimensionesValidas = validarDimensiones(
      dimensiones.width, 
      dimensiones.height, 
      tamanoFuente
    );

    try {
      setGuardando(true);
      setError(null);
      
      console.log('💾 Modal guardando:', {
        texto: textoTrimmed.substring(0, 30) + '...',
        dimensiones: dimensionesValidas,
        escala: escalaSegura
      });

      await onGuardar(
        textoTrimmed, 
        dimensionesValidas.fontSize, 
        dimensionesValidas.width, 
        dimensionesValidas.height
      );
      
      console.log('✅ Modal: guardado exitoso');
      
    } catch (backendError) {
      console.error('❌ Modal: error del backend:', backendError);
      setError(backendError.message || 'Error guardando en el servidor');
      setGuardando(false);
    }
  }, [texto, dimensiones, tamanoFuente, onGuardar, guardando, validarDimensiones, escalaSegura]);

  const handleEliminar = useCallback(async () => {
    if (guardando || !onEliminar) return;

    const confirmar = confirm('¿Estás seguro de que quieres eliminar este texto?');
    if (!confirmar) return;

    try {
      setGuardando(true);
      setError(null);
      
      console.log('🗑️ Modal eliminando');
      await onEliminar();
      console.log('✅ Modal: eliminado exitoso');
      
    } catch (backendError) {
      console.error('❌ Modal: error eliminando:', backendError);
      setError(backendError.message || 'Error eliminando del servidor');
      setGuardando(false);
    }
  }, [onEliminar, guardando]);

  const handleCancelar = useCallback(() => {
    if (guardando) {
      const confirmar = confirm('Hay una operación en progreso. ¿Cancelar de todas formas?');
      if (!confirmar) return;
    }
    
    console.log('❌ Modal: cancelando operación');
    onCancelar();
  }, [onCancelar, guardando]);

  // ===================== CONTROLES DE DIMENSIONES =====================
  const handleFontSizeChange = useCallback((nuevoTamano) => {
    const tamanoValido = Math.max(
      CONFIG.TEXTO.MIN_FONT_SIZE,
      Math.min(CONFIG.TEXTO.MAX_FONT_SIZE, nuevoTamano)
    );
    setTamanoFuente(tamanoValido);
  }, [CONFIG.TEXTO]);

  const handleDimensionesChange = useCallback((campo, valor) => {
    setDimensiones(prev => {
      const nuevasDimensiones = { ...prev, [campo]: valor };
      const validadas = validarDimensiones(nuevasDimensiones.width, nuevasDimensiones.height, tamanoFuente);
      return { width: validadas.width, height: validadas.height };
    });
  }, [validarDimensiones, tamanoFuente]);

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

  // ===================== RENDER =====================
  if (!isOpen) return null;

  return (
    <React.Fragment>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9999,
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}
        onClick={handleCancelar}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="texto-modal-robusto"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${Math.min(CONFIG.MODAL.MAX_WIDTH, window.innerWidth - 40)}px`,
          height: `${Math.min(CONFIG.MODAL.MAX_HEIGHT, window.innerHeight - 40)}px`,
          minWidth: `${CONFIG.MODAL.MIN_WIDTH}px`,
          minHeight: `${CONFIG.MODAL.MIN_HEIGHT}px`,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'inherit'
        }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #de007e, #c2185b)',
          color: 'white',
          padding: '16px 20px',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{titulo}</span>
            {escalaSegura !== 1 && (
              <span style={{ 
                fontSize: '11px', 
                opacity: 0.9,
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 6px',
                borderRadius: '3px'
              }}>
                Zoom: {Math.round(escalaSegura * 100)}%
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showBackendStatus && (
              <span style={{ 
                fontSize: '11px', 
                opacity: 0.9,
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                Backend Ready
              </span>
            )}
            <button
              onClick={handleCancelar}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'auto'
        }}>
          {/* Controles de configuración */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            flexShrink: 0
          }}>
            {/* Tamaño de fuente */}
            <div style={{
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <label style={{
                fontSize: '12px',
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
                  min={CONFIG.TEXTO.MIN_FONT_SIZE} 
                  max={CONFIG.TEXTO.MAX_FONT_SIZE} 
                  step="1" 
                  value={tamanoFuente}
                  disabled={guardando}
                  onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
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
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#de007e',
                  minWidth: '30px',
                  textAlign: 'center',
                  background: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid #de007e'
                }}>
                  {tamanoFuente}px
                </span>
              </div>
            </div>

            {/* Dimensiones */}
            <div style={{
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <label style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#495057',
                display: 'block',
                marginBottom: '8px'
              }}>
                Dimensiones (Base)
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min={CONFIG.TEXTO.MIN_WIDTH}
                    max={CONFIG.TEXTO.MAX_WIDTH}
                    value={dimensiones.width}
                    disabled={guardando}
                    onChange={(e) => handleDimensionesChange('width', parseInt(e.target.value) || CONFIG.TEXTO.MIN_WIDTH)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '11px',
                      textAlign: 'center'
                    }}
                  />
                  <div style={{ fontSize: '9px', color: '#666', textAlign: 'center', marginTop: '2px' }}>
                    Ancho
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min={CONFIG.TEXTO.MIN_HEIGHT}
                    max={CONFIG.TEXTO.MAX_HEIGHT}
                    value={dimensiones.height}
                    disabled={guardando}
                    onChange={(e) => handleDimensionesChange('height', parseInt(e.target.value) || CONFIG.TEXTO.MIN_HEIGHT)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '11px',
                      textAlign: 'center'
                    }}
                  />
                  <div style={{ fontSize: '9px', color: '#666', textAlign: 'center', marginTop: '2px' }}>
                    Alto
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa */}
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
              fontSize: '12px',
              fontWeight: 600,
              color: '#495057',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Vista Previa (Como se verá en el PDF)</span>
              <span style={{
                fontSize: '10px',
                color: '#de007e',
                background: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid #de007e'
              }}>
                {dimensionesPreview.scaled.width}×{dimensionesPreview.scaled.height}px
              </span>
            </div>
            
            <div style={{
              width: `${Math.min(350, dimensionesPreview.scaled.width)}px`,
              height: `${Math.min(150, dimensionesPreview.scaled.height)}px`,
              maxWidth: '100%',
              border: '2px solid rgba(222, 0, 126, 0.3)',
              borderStyle: 'dashed',
              borderRadius: '6px',
              background: 'rgba(222, 0, 126, 0.05)',
              padding: `${dimensionesPreview.scaled.padding}px`,
              fontSize: `${Math.min(dimensionesPreview.scaled.fontSize, 20)}px`,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 500,
              color: texto.trim() ? '#1a1a1a' : '#999',
              fontStyle: texto.trim() ? 'normal' : 'italic',
              lineHeight: 1.4,
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              overflow: 'hidden',
              position: 'relative',
              boxSizing: 'border-box'
            }}>
              {texto.trim() || 'Escribe tu texto para ver la vista previa...'}
              
              {/* Indicador de escala */}
              {escalaSegura !== 1 && (
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'rgba(222, 0, 126, 0.8)',
                  color: 'white',
                  fontSize: '8px',
                  padding: '1px 3px',
                  borderRadius: '2px',
                  fontFamily: 'monospace'
                }}>
                  {Math.round(escalaSegura * 100)}%
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
            style={{
              flex: 1,
              minHeight: '120px',
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
              if (!error) e.target.style.borderColor = '#de007e';
            }}
            onBlur={(e) => {
              if (!error) e.target.style.borderColor = '#e0e0e0';
            }}
          />

          {/* Estados y mensajes */}
          {guardando && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(222, 0, 126, 0.1)',
              border: '1px solid rgba(222, 0, 126, 0.3)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#c2185b',
              flexShrink: 0
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #c2185b',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span>Procesando en servidor...</span>
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
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Botones */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            borderTop: '1px solid #e0e0e0',
            paddingTop: '16px',
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
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
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
                fontSize: '14px',
                transition: 'all 0.2s ease'
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
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* CSS para animaciones */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .texto-modal-robusto {
          animation: fadeInScale 0.25s ease-out;
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </React.Fragment>
  );
};

export default TextoModal;
// TextoItem.jsx - Con integración backend
import React, { useEffect, useRef, useMemo } from 'react';

const TextoItem = ({
  texto,
  currentPDFScale = 1,
  isActive = true,
  isGuardando = false,
  onEdit,  // Backend function
  onDoubleClick,
  configurarEventos
}) => {
  const textoRef = useRef(null);
  const eventosConfigurados = useRef(false);

  console.log('TextoItem con backend:', {
    id: texto.id,
    isGuardando,
    scale: currentPDFScale.toFixed(3)
  });

  // Calcular dimensiones escaladas
  const dimensiones = useMemo(() => {
    const width = Math.round((texto.width || 200) * currentPDFScale);
    const height = Math.round((texto.height || 60) * currentPDFScale);
    const fontSize = Math.round((texto.fontSize || 14) * currentPDFScale);
    
    return {
      width: Math.max(80, Math.min(600, width)),
      height: Math.max(30, Math.min(400, height)),
      fontSize: Math.max(10, Math.min(32, fontSize))
    };
  }, [texto.width, texto.height, texto.fontSize, currentPDFScale]);

  // Configurar eventos cuando el elemento esté listo
  useEffect(() => {
    if (!textoRef.current || !isActive || eventosConfigurados.current) return;

    console.log('Configurando eventos backend para texto:', texto.id);
    
    // Configurar eventos a través del hook (que maneja el backend)
    if (configurarEventos) {
      const cleanups = configurarEventos(textoRef.current);
      eventosConfigurados.current = true;
      
      return () => {
        if (cleanups && Array.isArray(cleanups)) {
          cleanups.forEach(cleanup => {
            if (typeof cleanup === 'function') {
              cleanup();
            }
          });
        }
        eventosConfigurados.current = false;
      };
    }
  }, [isActive, configurarEventos, texto.id]);

  // Limpiar eventos cuando se desactiva
  useEffect(() => {
    if (!isActive) {
      eventosConfigurados.current = false;
    }
  }, [isActive]);

  // Render del componente React
  return (
    <div
      ref={textoRef}
      className="texto-zoom-fixed"
      data-texto-id={texto.id}
      data-pagina={texto.pagina}
      data-react-rendered="true"
      data-backend-ready="true"
      style={{
        position: 'absolute',
        left: `${texto.x * 100}%`,
        top: `${texto.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        width: `${dimensiones.width}px`,
        height: `${dimensiones.height}px`,
        zIndex: isGuardando ? 300 : 210,
        cursor: isActive ? 'pointer' : 'default',
        pointerEvents: isActive ? 'auto' : 'none',
        transition: 'all 0.2s ease',
        opacity: isGuardando ? 0.8 : 1,
        minWidth: '80px',
        minHeight: '30px',
        maxWidth: '600px',
        maxHeight: '400px'
      }}
    >
      {/* Contenido del texto */}
      <div 
        className="texto-contenido"
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          color: '#1a1a1a',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: `${dimensiones.fontSize}px`,
          fontWeight: 500,
          padding: '8px 12px',
          border: '2px solid transparent',
          borderRadius: '6px',
          boxSizing: 'border-box',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          lineHeight: 1.4,
          textShadow: '0 0 3px rgba(255,255,255,0.8)',
          cursor: 'inherit',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          position: 'relative'
        }}
      >
        {texto.texto}
      </div>

      {/* Handles de resize */}
      <div 
        className="resize-handles" 
        style={{ 
          display: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000
        }}
      >
        <div 
          className="resize-handle resize-se"
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '12px',
            height: '12px',
            background: '#2196f3',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'se-resize',
            pointerEvents: 'auto',
            zIndex: 1001,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease'
          }}
        />
      </div>

      {/* Indicador de guardado con backend */}
      {isGuardando && (
        <div 
          className="indicador-guardado"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: 'rgba(255, 152, 0, 0.9)',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            zIndex: 1002,
            animation: 'pulse 1s infinite',
            boxShadow: '0 2px 6px rgba(255, 152, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.8)'
          }}
        >
          ⏳
        </div>
      )}

      {/* Indicador de backend status */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(33, 150, 243, 0.9)',
            color: 'white',
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '3px',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            zIndex: 999,
            pointerEvents: 'none'
          }}
        >
          Backend: {isGuardando ? 'Saving...' : 'Ready'} | Scale: {currentPDFScale.toFixed(2)}
        </div>
      )}

      {/* CSS para animaciones */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default TextoItem;
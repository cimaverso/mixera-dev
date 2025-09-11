// WelcomeModal.jsx - Ventana emergente de bienvenida para el lector
import React, { useState, useEffect, useCallback } from 'react';

const WelcomeModal = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Controlar la animación de entrada
  useEffect(() => {
    if (isOpen) {
      // Pequeño delay para activar la animación
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Manejar el cierre del modal
  const handleClose = useCallback(() => {
    // Si el usuario marcó "No mostrar de nuevo", guardarlo en localStorage
    if (dontShowAgain) {
      try {
        localStorage.setItem('lector_welcome_dismissed', 'true');
        console.log('Preferencia guardada: no mostrar ventana de bienvenida');
      } catch (error) {
        console.warn('No se pudo guardar la preferencia en localStorage:', error);
      }
    }
    
    // Animación de salida
    setIsVisible(false);
    
    // Llamar al callback de cierre después de la animación
    setTimeout(() => {
      onClose();
    }, 300);
  }, [dontShowAgain, onClose]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleClose]);

  // No renderizar si no está abierto
  if (!isOpen) return null;

  return (
    <>
      {/* CSS para animaciones */}
      <style>{`
        @keyframes welcome-modal-fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes welcome-modal-fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
        
        .welcome-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(3px);
          z-index: 20000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
          opacity: ${isVisible ? '1' : '0'};
          transition: opacity 0.3s ease;
        }
        
        .welcome-modal-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
          transform: ${isVisible ? 'scale(1)' : 'scale(0.9)'};
          opacity: ${isVisible ? '1' : '0'};
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .welcome-modal-header {
          background: linear-gradient(135deg, #de007e, #ff1493);
          color: white;
          padding: 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .welcome-modal-header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.1) 10px,
            rgba(255, 255, 255, 0.1) 20px
          );
          animation: welcome-shine 3s linear infinite;
        }
        
        @keyframes welcome-shine {
          0% { transform: translateX(-100%) translateY(-100%); }
          100% { transform: translateX(100%) translateY(100%); }
        }
        
        .welcome-modal-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
          position: relative;
          z-index: 1;
        }
        
        .welcome-modal-subtitle {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
          position: relative;
          z-index: 1;
        }
        
        .welcome-modal-body {
          padding: 32px 24px 24px 24px;
        }
        
        .welcome-modal-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px auto;
          background: linear-gradient(135deg, #de007e, #ff1493);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(222, 0, 126, 0.3);
        }
        
        .welcome-modal-message {
          font-size: 16px;
          line-height: 1.6;
          color: #333;
          text-align: center;
          margin: 0 0 24px 0;
        }
        
        .welcome-modal-highlight {
          background: linear-gradient(135deg, rgba(222, 0, 126, 0.1), rgba(255, 20, 147, 0.1));
          border: 2px solid rgba(222, 0, 126, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin: 20px 0;
          text-align: center;
        }
        
        .welcome-modal-tool-icon {
          display: inline-block;
          background: #de007e;
          color: white;
          padding: 8px;
          border-radius: 8px;
          margin: 0 8px;
          vertical-align: middle;
        }
        
        .welcome-modal-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
          margin: 20px 0;
          cursor: pointer;
          transition: background 0.2s ease;
          border: 2px solid transparent;
        }
        
        .welcome-modal-checkbox:hover {
          background: #e9ecef;
          border-color: rgba(222, 0, 126, 0.2);
        }
        
        .welcome-modal-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #de007e;
          cursor: pointer;
        }
        
        .welcome-modal-checkbox label {
          font-size: 14px;
          color: #495057;
          cursor: pointer;
          flex: 1;
          margin: 0;
        }
        
        .welcome-modal-footer {
          padding: 0 24px 24px 24px;
          display: flex;
          justify-content: center;
        }
        
        .welcome-modal-button {
          background: linear-gradient(135deg, #de007e, #ff1493);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(222, 0, 126, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .welcome-modal-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(222, 0, 126, 0.4);
        }
        
        .welcome-modal-button:active {
          transform: translateY(0);
        }
        
        .welcome-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          z-index: 2;
          transition: background 0.2s ease;
        }
        
        .welcome-modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        @media (max-width: 768px) {
          .welcome-modal-container {
            margin: 10px;
            max-width: calc(100vw - 20px);
          }
          
          .welcome-modal-header {
            padding: 20px;
          }
          
          .welcome-modal-title {
            font-size: 20px;
          }
          
          .welcome-modal-body {
            padding: 24px 20px 20px 20px;
          }
          
          .welcome-modal-message {
            font-size: 15px;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div 
        className="welcome-modal-backdrop"
        onClick={handleClose}
      >
        {/* Modal Container */}
        <div 
          className="welcome-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="welcome-modal-header">
            <button 
              className="welcome-modal-close"
              onClick={handleClose}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2 className="welcome-modal-title">¡Bienvenido al Lector!</h2>
            <p className="welcome-modal-subtitle">Tu herramienta para anotar PDFs</p>
          </div>

          {/* Body */}
          <div className="welcome-modal-body">
            {/* Icono principal */}
            <div className="welcome-modal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
            </div>

            {/* Mensaje principal */}
            <p className="welcome-modal-message">
              Para ver y gestionar tus textos creados en este documento, necesitas activar la herramienta de creación de texto.
            </p>

            {/* Destacado con instrucciones */}
            <div className="welcome-modal-highlight">
              <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#de007e' }}>
                ¿Cómo activar la herramienta?
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                Busca el panel de herramientas en el lado derecho y haz clic en el ícono
                <span className="welcome-modal-tool-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479z"/>
                  </svg>
                </span>
                para comenzar a crear y ver tus anotaciones.
              </p>
            </div>

            {/* Checkbox para no mostrar de nuevo */}
            <div className="welcome-modal-checkbox" onClick={() => setDontShowAgain(!dontShowAgain)}>
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                id="dontShowAgain"
              />
              <label htmlFor="dontShowAgain">
                No mostrar este mensaje de nuevo
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="welcome-modal-footer">
            <button 
              className="welcome-modal-button"
              onClick={handleClose}
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomeModal;
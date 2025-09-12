// ProfileWelcomeModal.jsx - Ventana emergente de bienvenida para el perfil de usuario
import React, { useState, useEffect, useCallback } from 'react';

const ProfileWelcomeModal = ({ isOpen, onClose }) => {
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
        localStorage.setItem('profile_welcome_dismissed', 'true');
      } catch (error) {
        // Error silencioso
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
        @keyframes profile-welcome-fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes profile-welcome-fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
        
        .profile-welcome-backdrop {
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
        
        .profile-welcome-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
          transform: ${isVisible ? 'scale(1)' : 'scale(0.9)'};
          opacity: ${isVisible ? '1' : '0'};
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .profile-welcome-header {
          background: linear-gradient(135deg, #e73180, #ff1493);
          color: white;
          padding: 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .profile-welcome-header::before {
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
          animation: profile-welcome-shine 3s linear infinite;
        }
        
        @keyframes profile-welcome-shine {
          0% { transform: translateX(-100%) translateY(-100%); }
          100% { transform: translateX(100%) translateY(100%); }
        }
        
        .profile-welcome-title {
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px 0;
          position: relative;
          z-index: 1;
        }
        
        .profile-welcome-subtitle {
          font-size: 15px;
          opacity: 0.9;
          margin: 0;
          position: relative;
          z-index: 1;
        }
        
        .profile-welcome-body {
          padding: 32px 24px 24px 24px;
        }
        
        .profile-welcome-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px auto;
          background: linear-gradient(135deg, #e73180, #ff1493);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(231, 49, 128, 0.3);
        }
        
        .profile-welcome-message {
          font-size: 16px;
          line-height: 1.7;
          color: #333;
          text-align: center;
          margin: 0 0 28px 0;
        }
        
        .profile-welcome-features {
          background: linear-gradient(135deg, rgba(231, 49, 128, 0.08), rgba(255, 20, 147, 0.08));
          border: 2px solid rgba(231, 49, 128, 0.15);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .profile-welcome-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .profile-welcome-feature-item:last-child {
          margin-bottom: 0;
        }
        
        .profile-welcome-feature-icon {
          background: #e73180;
          color: white;
          padding: 8px;
          border-radius: 8px;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .profile-welcome-checkbox {
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
        
        .profile-welcome-checkbox:hover {
          background: #e9ecef;
          border-color: rgba(231, 49, 128, 0.2);
        }
        
        .profile-welcome-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #e73180;
          cursor: pointer;
        }
        
        .profile-welcome-checkbox label {
          font-size: 14px;
          color: #495057;
          cursor: pointer;
          flex: 1;
          margin: 0;
        }
        
        .profile-welcome-footer {
          padding: 0 24px 24px 24px;
          display: flex;
          justify-content: center;
        }
        
        .profile-welcome-button {
          background: linear-gradient(135deg, #e73180, #ff1493);
          color: white;
          border: none;
          padding: 14px 36px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(231, 49, 128, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .profile-welcome-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(231, 49, 128, 0.4);
        }
        
        .profile-welcome-button:active {
          transform: translateY(0);
        }
        
        .profile-welcome-close {
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
        
        .profile-welcome-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        @media (max-width: 768px) {
          .profile-welcome-container {
            margin: 10px;
            max-width: calc(100vw - 20px);
          }
          
          .profile-welcome-header {
            padding: 20px;
          }
          
          .profile-welcome-title {
            font-size: 22px;
          }
          
          .profile-welcome-body {
            padding: 24px 20px 20px 20px;
          }
          
          .profile-welcome-message {
            font-size: 15px;
          }
          
          .profile-welcome-features {
            padding: 16px;
          }
          
          .profile-welcome-feature-item {
            font-size: 13px;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div 
        className="profile-welcome-backdrop"
        onClick={handleClose}
      >
        {/* Modal Container */}
        <div 
          className="profile-welcome-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="profile-welcome-header">
            <button 
              className="profile-welcome-close"
              onClick={handleClose}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2 className="profile-welcome-title">¡Que disfrutes tu lectura!</h2>
            <p className="profile-welcome-subtitle">Bienvenido a tu plataforma de aprendizaje</p>
          </div>

          {/* Body */}
          <div className="profile-welcome-body">
            {/* Icono principal */}
            <div className="profile-welcome-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>

            {/* Mensaje principal */}
            <p className="profile-welcome-message">
              Para aprovechar al máximo tu experiencia de lectura, te recomendamos explorar nuestras herramientas de apoyo antes de comenzar.
            </p>

            {/* Características destacadas */}
            <div className="profile-welcome-features">
              <div className="profile-welcome-feature-item">
                <div className="profile-welcome-feature-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <div>
                  <strong>Tutoriales interactivos:</strong> Aprende a usar todas las funciones de la plataforma y optimiza tu experiencia de lectura con nuestras guías paso a paso.
                </div>
              </div>
              
              <div className="profile-welcome-feature-item">
                <div className="profile-welcome-feature-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>
                  </svg>
                </div>
                <div>
                  <strong>Centro de soporte:</strong> Envía tus consultas, reporta problemas o comparte tu feedback para ayudarnos a mejorar continuamente.
                </div>
              </div>
            </div>

            {/* Checkbox para no mostrar de nuevo */}
            <div className="profile-welcome-checkbox" onClick={() => setDontShowAgain(!dontShowAgain)}>
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                id="dontShowAgainProfile"
              />
              <label htmlFor="dontShowAgainProfile">
                No mostrar este mensaje de bienvenida nuevamente
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="profile-welcome-footer">
            <button 
              className="profile-welcome-button"
              onClick={handleClose}
            >
              ¡Comenzar!
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileWelcomeModal;
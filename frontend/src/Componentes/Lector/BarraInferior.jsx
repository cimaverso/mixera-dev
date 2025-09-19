// BarraInferior.jsx - CON COMPORTAMIENTO ADAPTATIVO MÃ“VIL
import React, { useState, useEffect, useCallback } from 'react';
import { useMobileDetection } from './hooks/useMobileDetection';
import './lector.css';

export default function BarraInferior({ paginaActual, totalPaginas, visorRef }) {
    const { 
        isMobile, 
        isTouch, 
        shouldUseNativeGestures, 
        needsCompactUI,
        orientation 
    } = useMobileDetection();

    // Estado para auto-ocultar en mÃ³vil
    const [visible, setVisible] = useState(!isMobile);
    const [lastInteraction, setLastInteraction] = useState(Date.now());
    const [userInteracted, setUserInteracted] = useState(false);

    // Registrar interacciones del usuario para controlar visibilidad
    const handleUserInteraction = useCallback(() => {
        setLastInteraction(Date.now());
        if (!userInteracted) {
            setUserInteracted(true);
        }
        
        // Mostrar barra temporalmente en mÃ³vil
        if (isMobile) {
            setVisible(true);
        }
    }, [isMobile, userInteracted]);

    // Auto-ocultar en mÃ³vil despuÃ©s de inactividad
    useEffect(() => {
        if (!isMobile) {
            setVisible(true);
            return;
        }

        // En mÃ³vil, mostrar inicialmente y luego auto-ocultar
        const timer = setTimeout(() => {
            const timeSinceInteraction = Date.now() - lastInteraction;
            
            // Ocultar despuÃ©s de 4 segundos de inactividad
            if (timeSinceInteraction > 4000 && userInteracted) {
                setVisible(false);
            }
        }, 4000);

        return () => clearTimeout(timer);
    }, [lastInteraction, isMobile, userInteracted]);

    // Listeners para detectar interacciones en mÃ³vil
    useEffect(() => {
        if (!isMobile) return;

        // Detectar taps/toques en la pantalla
        const handleTouchStart = () => {
            handleUserInteraction();
        };

        // Detectar scroll
        const handleScroll = () => {
            handleUserInteraction();
        };

        // Detectar movimiento del mouse (para hÃ­bridos)
        const handleMouseMove = () => {
            handleUserInteraction();
        };

        const visorElement = document.querySelector('.visor-pdf');
        if (visorElement) {
            visorElement.addEventListener('touchstart', handleTouchStart, { passive: true });
            visorElement.addEventListener('scroll', handleScroll, { passive: true });
            visorElement.addEventListener('mousemove', handleMouseMove, { passive: true });

            return () => {
                visorElement.removeEventListener('touchstart', handleTouchStart);
                visorElement.removeEventListener('scroll', handleScroll);
                visorElement.removeEventListener('mousemove', handleMouseMove);
            };
        }
    }, [isMobile, handleUserInteraction]);

    // FunciÃ³n para manejar clicks en controles (con feedback de interacciÃ³n)
    const handleControlClick = useCallback((action) => {
        handleUserInteraction();
        
        // Ejecutar la acciÃ³n
        if (typeof action === 'function') {
            action();
        }
        
        // En mÃ³vil, mantener visible un poco mÃ¡s despuÃ©s de usar controles
        if (isMobile) {
            setTimeout(() => {
                setLastInteraction(Date.now());
            }, 1000);
        }
    }, [handleUserInteraction, isMobile]);

    // Determinar quÃ© controles mostrar segÃºn el dispositivo
    const controlesMostrar = {
        navegacion: true, // Siempre mostrar navegaciÃ³n
        zoom: !shouldUseNativeGestures, // Ocultar zoom si hay gestos nativos
        vista: !isMobile, // Vista doble solo en desktop
        fullscreen: true // Siempre disponible
    };

    // Estilos dinÃ¡micos para la barra
    const estilosBarra = {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: isMobile ? 'var(--barra-height-mobile)' : 'var(--barra-height-desktop)',
        
        // Comportamiento de visibilidad en mÃ³vil
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-in-out',
        
        // Fondo adaptativo
        background: isMobile 
            ? 'rgba(0, 0, 0, 0.9)' 
            : 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        
        padding: isMobile ? '0 10px' : '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '8px' : '12px',
        zIndex: 'calc(var(--z-index-panel) + 5)',
        
        border: 'none',
        borderRadius: 0,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.2)',
        
        minHeight: isMobile ? 'var(--barra-height-mobile)' : 'var(--barra-height-desktop)',
        maxWidth: 'none'
    };

    // FunciÃ³n para renderizar botÃ³n con estilos adaptativos
    const renderBoton = (icono, titulo, accion, mostrar = true, estiloExtra = {}) => {
        if (!mostrar) return null;

        return (
            <button 
                title={titulo}
                onClick={() => handleControlClick(accion)}
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    fontSize: isMobile ? '14px' : '16px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all var(--transition-normal)',
                    padding: isMobile ? '6px' : '8px',
                    borderRadius: '6px',
                    minWidth: isMobile ? '36px' : '40px',
                    minHeight: isMobile ? '30px' : '34px',
                    flexShrink: 0,
                    
                    // Estilos tÃ¡ctiles para mÃ³vil
                    ...(isMobile && {
                        minWidth: '44px', // TamaÃ±o mÃ­nimo para toque
                        minHeight: '44px',
                        touchAction: 'manipulation'
                    }),
                    
                    ...estiloExtra
                }}
                onTouchStart={() => {
                    // Feedback tÃ¡ctil inmediato
                    if (isMobile) {
                        const button = event.currentTarget;
                        button.style.background = 'rgba(33, 150, 243, 0.6)';
                        setTimeout(() => {
                            button.style.background = 'rgba(255, 255, 255, 0.1)';
                        }, 150);
                    }
                }}
            >
                {icono}
            </button>
        );
    };

    return (
        <>
            <div 
                className="barra-inferior barra-inferior-mobile"
                style={estilosBarra}
            >
                {/* NavegaciÃ³n - Siempre visible */}
                {renderBoton(
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        className="bi bi-skip-start" viewBox="0 0 16 16">
                        <path d="M4 4a.5.5 0 0 1 1 0v3.248l6.267-3.636c.52-.302 1.233.043 1.233.696v7.384c0 .653-.713.998-1.233.696L5 8.752V12a.5.5 0 0 1-1 0zm7.5.633L5.696 8l5.804 3.367z"/>
                    </svg>,
                    "PÃ¡gina anterior",
                    () => visorRef.current?.prevPage(),
                    controlesMostrar.navegacion
                )}

                {/* Indicador de pÃ¡gina */}
                <span style={{
                    color: 'white',
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: '600',
                    padding: isMobile ? '6px 8px' : '8px 12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    minWidth: isMobile ? '50px' : '60px',
                    textAlign: 'center',
                    height: isMobile ? '30px' : '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    {paginaActual} / {totalPaginas}
                </span>

                {renderBoton(
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        className="bi bi-skip-end" viewBox="0 0 16 16">
                        <path d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.713 3.31 4 3.655 4 4.308v7.384c0 .653.713.998 1.233.696L11.5 8.752V12a.5.5 0 0 0 1 0zM5 4.633 10.804 8 5 11.367z"/>
                    </svg>,
                    "PÃ¡gina siguiente",
                    () => visorRef.current?.nextPage(),
                    controlesMostrar.navegacion
                )}

                {/* Controles de zoom - Solo si no hay gestos nativos */}
                {renderBoton(
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        className="bi bi-zoom-out" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
                        <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
                        <path fillRule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/>
                    </svg>,
                    isMobile ? "Reducir zoom (usar gestos)" : "Reducir zoom",
                    () => visorRef.current?.zoomOut(),
                    controlesMostrar.zoom
                )}

                {renderBoton(
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        className="bi bi-zoom-in" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
                        <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
                        <path fillRule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"/>
                    </svg>,
                    isMobile ? "Aumentar zoom (usar gestos)" : "Aumentar zoom",
                    () => visorRef.current?.zoomIn(),
                    controlesMostrar.zoom
                )}

                {/* Vista una pÃ¡gina */}
                {renderBoton(
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        className="bi bi-file" viewBox="0 0 16 16">
                        <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1"/>
                    </svg>,
                    "Vista de una pÃ¡gina",
                    () => visorRef.current?.vistaUna(),
                    controlesMostrar.vista
                )}

                {/* Pantalla completa */}
                {renderBoton(
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        className="bi bi-aspect-ratio" viewBox="0 0 16 16">
                        <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h13A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5zM1.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5z"/>
                        <path d="M2 4.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1H3v2.5a.5.5 0 0 1-1 0zm12 7a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H13V8.5a.5.5 0 0 1 1 0z"/>
                    </svg>,
                    "Pantalla completa",
                    () => visorRef.current?.enterFullScreen(),
                    controlesMostrar.fullscreen
                )}
            </div>

            {/* Indicador de instrucciones para mÃ³vil (solo al inicio) */}
            {isMobile && !userInteracted && (
                <div
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(222, 0, 126, 0.95)',
                        color: 'white',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        zIndex: 1500,
                        textAlign: 'center',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        maxWidth: '300px',
                        lineHeight: '1.4'
                    }}
                    onClick={handleUserInteraction}
                >
                    <div style={{ marginBottom: '8px' }}>Modo MÃ³vil Activado</div>
                    <div>
                        {shouldUseNativeGestures 
                            ? "Usa gestos tÃ¡ctiles para zoom y navegaciÃ³n. Toca aquÃ­ para ver controles."
                            : "Toca aquÃ­ para ver los controles de navegaciÃ³n."
                        }
                    </div>
                </div>
            )}

            {/* Mensaje flotante para zoom tÃ¡ctil */}
            {isMobile && shouldUseNativeGestures && visible && userInteracted && (
                <div
                    style={{
                        position: 'fixed',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        zIndex: 300,
                        textAlign: 'center',
                        opacity: visible ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: 'none'
                    }}
                >
                    Pellizca para zoom â€¢ Desliza para cambiar pÃ¡gina
                </div>
            )}

            {/* Debug info mÃ³vil (solo desarrollo) */}
            {process.env.NODE_ENV === 'development' && isMobile && (
                <div
                    style={{
                        position: 'fixed',
                        top: '50px',
                        right: '10px',
                        background: 'rgba(222, 0, 126, 0.9)',
                        color: 'white',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        zIndex: 400,
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                >
                    <div>MÃ³vil: {orientation}</div>
                    <div>Barra: {visible ? 'Visible' : 'Oculta'}</div>
                    <div>Gestos: {shouldUseNativeGestures ? 'ON' : 'OFF'}</div>
                    <div>Compacto: {needsCompactUI ? 'SI' : 'NO'}</div>
                </div>
            )}
        </>
    );
}
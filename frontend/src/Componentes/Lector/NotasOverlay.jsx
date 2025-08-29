import React, { useState, useEffect, useRef, useCallback } from 'react';
import './lector.css';

function NotasOverlay({
    paginaActual,
    notas,
    modoNota,
    onAddNota,
    onEditNota,
    onDeleteNota,
    zoom = 1,
    modoVista = 'single',
    onDesactivarHerramienta = () => {},
    pageWidth,
    pageHeight,
}) {
    console.log('📝 NotasOverlay render:', {
        paginaActual,
        modoNota,
        cantidadNotas: notas.length,
        zoom,
        modoVista,
        pageWidth,
        pageHeight
    });

    const [nueva, setNueva] = useState(null);
    const [textoTmp, setTextoTmp] = useState('');
    const overlayRef = useRef(null);
    const [pageInfo, setPageInfo] = useState({ width: 0, height: 0, top: 0, left: 0 });

    // NUEVO: Función para calcular posición teniendo en cuenta transforms
    const calculatePagePosition = useCallback(() => {
        // Buscar la página específica
        const pageElement = document.querySelector(`.rpv-core__inner-page[aria-label="Page ${paginaActual}"]`);
        
        if (pageElement) {
            console.log('📝 Elemento página encontrado:', pageElement);
            
            // Obtener el contenedor del visor
            const viewer = document.querySelector('.rpv-core__viewer') || 
                          document.querySelector('.visor-pdf') ||
                          pageElement.closest('[class*="viewer"]');
            
            if (viewer) {
                const pageRect = pageElement.getBoundingClientRect();
                const viewerRect = viewer.getBoundingClientRect();
                
                // CLAVE: Calcular posición considerando scroll del viewer
                const scrollTop = viewer.scrollTop || 0;
                const scrollLeft = viewer.scrollLeft || 0;
                
                const info = {
                    width: pageRect.width,
                    height: pageRect.height,
                    // Posición relativa al viewer + ajuste por scroll
                    top: (pageRect.top - viewerRect.top) + scrollTop,
                    left: (pageRect.left - viewerRect.left) + scrollLeft
                };
                
                setPageInfo(info);
                
                console.log('📝 Posición calculada:', {
                    pageNumber: paginaActual,
                    pageRect: {
                        top: Math.round(pageRect.top),
                        left: Math.round(pageRect.left),
                        width: Math.round(pageRect.width),
                        height: Math.round(pageRect.height)
                    },
                    viewerRect: {
                        top: Math.round(viewerRect.top),
                        left: Math.round(viewerRect.left),
                        width: Math.round(viewerRect.width),
                        height: Math.round(viewerRect.height)
                    },
                    scroll: { top: scrollTop, left: scrollLeft },
                    calculatedInfo: {
                        top: Math.round(info.top),
                        left: Math.round(info.left),
                        width: Math.round(info.width),
                        height: Math.round(info.height)
                    }
                });
                
                return true;
            }
        }
        
        console.log('📝 No se pudo calcular posición para página:', paginaActual);
        return false;
    }, [paginaActual]);

    // Actualizar posición cuando cambie la página o el zoom
    useEffect(() => {
        if (modoVista !== 'single') return;
        
        const updatePosition = () => {
            calculatePagePosition();
        };

        // Actualizar inmediatamente y después de delays
        updatePosition();
        const timer1 = setTimeout(updatePosition, 100);
        const timer2 = setTimeout(updatePosition, 300);
        
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [paginaActual, modoVista, zoom, calculatePagePosition]);

    // NUEVO: Observer para cambios en el DOM y scroll
    useEffect(() => {
        const viewer = document.querySelector('.rpv-core__viewer');
        if (!viewer) return;

        // Observer para scroll
        const handleScroll = () => {
            if (modoVista === 'single') {
                calculatePagePosition();
            }
        };

        // Observer para cambios en el DOM
        const observer = new MutationObserver(() => {
            calculatePagePosition();
        });

        viewer.addEventListener('scroll', handleScroll);
        observer.observe(viewer, { 
            childList: true, 
            subtree: true, 
            attributes: true,
            attributeFilter: ['style', 'transform']
        });

        return () => {
            viewer.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, [calculatePagePosition, modoVista]);

    // Resto de las funciones (sin cambios)
    const handleLayerClick = (e) => {
        console.log('📝 NotasOverlay - Click detectado:', {
            modoNota,
            button: e.button,
            target: e.target.className,
            nuevaExistente: !!nueva
        });
        
        if (!modoNota || e.button !== 0 || nueva || e.target.closest('.annotation-icon')) {
            return;
        }
        
        const layerRect = overlayRef.current.getBoundingClientRect();
        const x = (e.clientX - layerRect.left) / layerRect.width;
        const y = (e.clientY - layerRect.top) / layerRect.height;
        
        console.log('📝 NotasOverlay - Posición calculada:', { 
            x, y, 
            layerRect: {
                left: Math.round(layerRect.left),
                top: Math.round(layerRect.top),
                width: Math.round(layerRect.width),
                height: Math.round(layerRect.height)
            },
            clientPos: { x: e.clientX, y: e.clientY }
        });
        
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        
        setNueva({ x, y });
        setTextoTmp('');
    };

    const handleGuardarNueva = () => {
        if (!textoTmp.trim()) return;
        onAddNota({ pagina: paginaActual, x: nueva.x, y: nueva.y, texto: textoTmp });
        setNueva(null);
        setTextoTmp('');
        onDesactivarHerramienta();
    };

    // Edición de notas
    const [editandoId, setEditandoId] = useState(null);
    const [textoEdit, setTextoEdit] = useState('');
    
    const handleEditar = (nota) => {
        setEditandoId(nota.id);
        setTextoEdit(nota.texto);
    };
    
    const handleGuardarEdicion = () => {
        onEditNota({ id: editandoId, texto: textoEdit });
        setEditandoId(null);
        setTextoEdit('');
        onDesactivarHerramienta();
    };

    const handleEliminarNota = (id) => {
        onDeleteNota(id);
        setEditandoId(null);
        setTextoEdit('');
        onDesactivarHerramienta();
    };

    const handleCancelarNueva = () => {
        setNueva(null);
        setTextoTmp('');
        onDesactivarHerramienta();
    };

    const notasPagina = notas.filter(n => n.pagina === paginaActual);

    return (
        <div
            ref={overlayRef}
            className="annotation-layer"
            data-tool={modoNota ? 'nota' : ''}
            style={{
                position: 'absolute',
                top: pageInfo.top,
                left: pageInfo.left,
                width: pageInfo.width,
                height: pageInfo.height,
                pointerEvents: modoNota ? 'auto' : 'none',
                zIndex: 20,
                cursor: modoNota ? 'crosshair' : 'default',
                // DEBUG: Borde y fondo visible
                border: modoNota ? '2px solid rgba(255, 0, 0, 0.5)' : 'none',
                background: modoNota ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
                // IMPORTANTE: Evitar que se mueva con transforms
                transform: 'none',
            }}
            onMouseDown={modoNota ? handleLayerClick : undefined}
        >
            {/* DEBUG: Info de posición */}
            {modoNota && (
                <div style={{
                    position: 'absolute',
                    top: 5,
                    left: 5,
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    zIndex: 1000,
                    whiteSpace: 'nowrap'
                }}>
                    Pág {paginaActual} | {Math.round(pageInfo.width)}x{Math.round(pageInfo.height)} | 
                    Top:{Math.round(pageInfo.top)} Left:{Math.round(pageInfo.left)}
                </div>
            )}

            {/* Stickies existentes */}
            {notasPagina.map(nota => (
                <div
                    key={nota.id}
                    className="annotation-icon"
                    style={{
                        position: 'absolute',
                        left: `${nota.x * 100}%`,
                        top: `${nota.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto',
                        zIndex: 21,
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease',
                    }}
                    onClick={e => { 
                        e.stopPropagation(); 
                        handleEditar(nota); 
                    }}
                    title={`Nota: ${nota.texto}`}
                >
                    <svg width={32} height={32} viewBox="0 0 24 24" fill="#ffeb3b" stroke="#9e9e9e" strokeWidth={1}>
                        <rect x="4" y="4" width="16" height="16" rx="3" />
                        <circle cx="12" cy="12" r="2" fill="#333" />
                    </svg>
                    
                    {editandoId === nota.id && (
                        <div
                            className="annotation-popup"
                            style={{
                                position: 'absolute',
                                top: '120%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                minWidth: 200,
                                maxWidth: 300,
                                background: '#fffbe7',
                                border: '1px solid #e3d895',
                                borderRadius: 8,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                padding: 12,
                                zIndex: 999,
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <textarea
                                value={textoEdit}
                                onChange={e => setTextoEdit(e.target.value)}
                                autoFocus
                                placeholder="Edita tu nota"
                                style={{
                                    width: '100%',
                                    minHeight: 60,
                                    borderRadius: 4,
                                    border: '1px solid #ddd',
                                    padding: 8,
                                    fontSize: 14,
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Escape') setEditandoId(null);
                                    else if (e.key === 'Enter' && e.ctrlKey) handleGuardarEdicion();
                                }}
                            />
                            <div style={{ 
                                marginTop: 8, 
                                display: 'flex', 
                                gap: 8,
                                justifyContent: 'flex-end',
                            }}>
                                <button onClick={handleGuardarEdicion} style={{ color: '#2196f3', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                                    Guardar
                                </button>
                                <button onClick={() => setEditandoId(null)} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                                    Cerrar
                                </button>
                                <button onClick={() => handleEliminarNota(nota.id)} style={{ color: '#e53935', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Popup para nueva sticky */}
            {nueva && (
                <div
                    className="annotation-icon"
                    style={{
                        position: 'absolute',
                        left: `${nueva.x * 100}%`,
                        top: `${nueva.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto',
                        zIndex: 22,
                    }}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <svg width={32} height={32} viewBox="0 0 24 24" fill="#ffeb3b" stroke="#9e9e9e" strokeWidth={1}>
                        <rect x="4" y="4" width="16" height="16" rx="3" />
                        <circle cx="12" cy="12" r="2" fill="#333" />
                    </svg>
                    
                    <div
                        className="annotation-popup"
                        style={{
                            position: 'absolute',
                            top: '120%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            minWidth: 200,
                            background: '#fffbe7',
                            border: '1px solid #e3d895',
                            borderRadius: 8,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            padding: 12,
                            zIndex: 999,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <textarea
                            value={textoTmp}
                            onChange={e => setTextoTmp(e.target.value)}
                            autoFocus
                            placeholder="Escribe tu nota aquí..."
                            style={{
                                width: '100%',
                                minHeight: 60,
                                borderRadius: 4,
                                border: '1px solid #ddd',
                                padding: 8,
                                fontSize: 14,
                                resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Escape') handleCancelarNueva();
                                else if (e.key === 'Enter' && e.ctrlKey) handleGuardarNueva();
                            }}
                        />
                        <div style={{ 
                            marginTop: 8, 
                            display: 'flex', 
                            gap: 8,
                            justifyContent: 'flex-end',
                        }}>
                            <button 
                                onClick={handleGuardarNueva} 
                                disabled={!textoTmp.trim()}
                                style={{ 
                                    color: '#2196f3', 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    opacity: textoTmp.trim() ? 1 : 0.5
                                }}
                            >
                                Guardar
                            </button>
                            <button onClick={handleCancelarNueva} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotasOverlay;
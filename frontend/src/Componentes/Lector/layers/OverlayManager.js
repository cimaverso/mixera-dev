// OverlayManager.js - OPTIMIZADO SOLO PARA TEXTOS v3
// Gestiona overlays independientes sin interferencias

import React from 'react';

/**
 * OverlayManager optimizado para textos únicamente
 */
class OverlayManager {
  constructor(tipoHerramienta) {
    this.tipo = tipoHerramienta;
    this.overlays = new Map(); // pagina -> overlay element
    this.eventListeners = new Map(); // key -> cleanup function
    this.isActive = false;
    this.lastCleanup = 0;
    this.lastPageSearch = 0;
    this.cachedPages = [];
    this.scaleCache = 1.0;
    
    console.log(`🎨 OverlayManager[${this.tipo}]: Inicializado optimizado para textos v3`);
  }

  /**
   * Busca páginas del PDF con estrategia optimizada
   */
  async buscarPaginas(maxIntentos = 3, usarCache = true) {
    const ahora = Date.now();
    
    // Usar cache si es reciente (menos de 3 segundos)
    if (usarCache && this.cachedPages.length > 0 && (ahora - this.lastPageSearch) < 3000) {
      console.log(`📋 OverlayManager[${this.tipo}]: Usando páginas desde cache (${this.cachedPages.length})`);
      return this.cachedPages;
    }

    return new Promise((resolve) => {
      let intentos = 0;
      
      const buscar = () => {
        // Verificar estado del documento
        if (document.readyState !== 'complete') {
          if (intentos < maxIntentos) {
            intentos++;
            setTimeout(buscar, 300);
          } else {
            resolve([]);
          }
          return;
        }

        // Selectores optimizados para el visor específico
        const selectores = [
          '.rpv-core__inner-page',
          '[data-testid="core__page-layer"]',
          '.rpv-core__page-layer',
          '.dual-page canvas',
          '.dual-canvas',
          '.visor-pdf canvas',
          '.visor-pdf [class*="page"]'
        ];
        
        let todasPaginas = [];
        let mejorSelector = null;
        
        for (const selector of selectores) {
          try {
            const encontradas = document.querySelectorAll(selector);
            if (encontradas.length > 0) {
              const paginasValidas = Array.from(encontradas).filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 100 && rect.height > 100; // Páginas válidas
              });
              
              if (paginasValidas.length > todasPaginas.length) {
                todasPaginas = paginasValidas;
                mejorSelector = selector;
              }
            }
          } catch (e) {
            // Selector inválido, continuar
          }
        }
        
        if (todasPaginas.length > 0) {
          console.log(`✅ OverlayManager[${this.tipo}]: ${todasPaginas.length} páginas encontradas con "${mejorSelector}"`);
          
          this.cachedPages = todasPaginas;
          this.lastPageSearch = ahora;
          resolve(todasPaginas);
          return;
        }
        
        // Reintentar si hay elementos del visor
        const visorPDF = document.querySelector('.visor-pdf');
        const rpvViewer = document.querySelector('.rpv-core__viewer');
        
        if ((visorPDF || rpvViewer) && intentos < maxIntentos) {
          intentos++;
          console.log(`⏳ OverlayManager[${this.tipo}]: Reintentando búsqueda (${intentos}/${maxIntentos})`);
          setTimeout(buscar, 500 + (intentos * 200));
          return;
        }
        
        console.warn(`❌ OverlayManager[${this.tipo}]: No se encontraron páginas después de ${maxIntentos} intentos`);
        resolve([]);
      };
      
      buscar();
    });
  }

  /**
   * Crea o obtiene overlay para una página específica
   */
  asegurarOverlay(paginaElement, numeroPagina, forzarRecreacion = false) {
    const overlayId = `${this.tipo}-overlay-v3-${numeroPagina}`;
    let overlay = this.overlays.get(numeroPagina);

    // Verificar integridad del overlay existente
    if (overlay && (!overlay.parentNode || overlay.dataset.herramienta !== this.tipo)) {
      console.log(`🔄 OverlayManager[${this.tipo}]: Overlay página ${numeroPagina} perdió integridad, recreando`);
      overlay = null;
      this.overlays.delete(numeroPagina);
    }

    if (!overlay || forzarRecreacion) {
      // Limpiar overlay anterior si existe
      if (overlay) {
        this.limpiarOverlay(numeroPagina);
      }

      // Crear nuevo overlay optimizado
      overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.className = `${this.tipo}-overlay-layer-v2`;
      overlay.dataset.layer = this.tipo;
      overlay.dataset.pagina = numeroPagina.toString();
      overlay.dataset.overlayManager = 'v3';
      overlay.dataset.herramienta = this.tipo;
      overlay.dataset.timestamp = Date.now().toString();

      // Configuración optimizada del overlay
      this.configurarOverlayBase(overlay, numeroPagina);

      // Asegurar posición relativa en la página
      const elementoPadre = paginaElement;
      if (elementoPadre) {
        const computedStyle = getComputedStyle(elementoPadre);
        if (computedStyle.position === 'static') {
          elementoPadre.style.position = 'relative';
        }

        elementoPadre.appendChild(overlay);
        this.overlays.set(numeroPagina, overlay);

        console.log(`✅ OverlayManager[${this.tipo}]: Overlay creado para página ${numeroPagina}`);
      } else {
        console.warn(`⚠️ OverlayManager[${this.tipo}]: No se pudo agregar overlay a página ${numeroPagina}`);
        return null;
      }
    }

    // Configurar interacción según estado activo
    this.configurarInteraccion(overlay, numeroPagina);

    return overlay;
  }

  /**
   * Configuración base del overlay optimizada
   */
  configurarOverlayBase(overlay, numeroPagina) {
    const zIndex = this.getZIndex();
    
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      touch-action: none;
      z-index: ${zIndex};
      pointer-events: none;
      box-sizing: border-box;
      transform: translateZ(0);
      backface-visibility: hidden;
    `;

    // Identificador visual solo en development
    if (process.env.NODE_ENV === 'development') {
      const debugColor = this.getDebugColor();
      overlay.style.boxShadow = `inset 0 0 0 1px rgba(${debugColor}, 0.15)`;
      overlay.style.background = `rgba(${debugColor}, 0.01)`;
      overlay.setAttribute('title', `Overlay ${this.tipo} - Página ${numeroPagina}`);
    }
  }

  /**
   * Configura la interacción del overlay
   */
  configurarInteraccion(overlay, numeroPagina) {
    overlay.style.pointerEvents = this.isActive ? 'auto' : 'none';
    overlay.dataset.activo = this.isActive.toString();
    overlay.dataset.lastUpdate = Date.now().toString();

    // Cursor visual
    overlay.style.cursor = this.isActive ? this.getCursor() : 'default';
    
    // Asegurar que elementos persistentes mantengan su visibilidad
    const elementosPersistentes = overlay.querySelectorAll('[data-persistent="true"]');
    elementosPersistentes.forEach(elemento => {
      elemento.style.display = '';
      elemento.style.visibility = 'visible';
      
      if (elemento.dataset.persistentType === this.tipo) {
        elemento.style.pointerEvents = this.isActive ? 'auto' : 'none';
      }
    });
  }

  /**
   * Activa/desactiva interacción
   */
  setActive(activo) {
    if (this.isActive === activo) return;
    
    const estadoAnterior = this.isActive;
    this.isActive = activo;
    
    console.log(`🔄 OverlayManager[${this.tipo}]: ${estadoAnterior ? 'ACTIVO' : 'INACTIVO'} → ${activo ? 'ACTIVO' : 'INACTIVO'}`);

    // Actualizar todos los overlays existentes
    this.overlays.forEach((overlay, numeroPagina) => {
      if (overlay && overlay.parentNode) {
        this.configurarInteraccion(overlay, numeroPagina);
      }
    });

    // Si se desactiva, limpiar listeners pero NO elementos persistentes
    if (!activo) {
      this.limpiarEventListeners();
      console.log(`🎧 OverlayManager[${this.tipo}]: Event listeners limpiados (elementos persistentes preservados)`);
    }
  }

  /**
   * Registra un event listener con clave única
   */
  registrarEventListener(numeroPagina, elemento, evento, handler, opciones = {}) {
    const key = `${this.tipo}-${numeroPagina}-${evento}-${Date.now()}`;
    
    // Limpiar listener anterior si existe con el mismo patrón
    const keyPattern = `${this.tipo}-${numeroPagina}-${evento}`;
    this.limpiarEventListenersPorPatron(keyPattern);

    try {
      elemento.addEventListener(evento, handler, opciones);
      
      const cleanup = () => {
        try {
          if (elemento && elemento.removeEventListener) {
            elemento.removeEventListener(evento, handler, opciones);
          }
        } catch (error) {
          console.warn(`⚠️ OverlayManager[${this.tipo}]: Error limpiando listener ${key}:`, error);
        }
      };
      
      this.eventListeners.set(key, cleanup);
      
      console.log(`🎧 OverlayManager[${this.tipo}]: Event listener registrado: ${key}`);
      return cleanup;
    } catch (error) {
      console.error(`❌ OverlayManager[${this.tipo}]: Error registrando listener:`, error);
      return () => {};
    }
  }

  /**
   * Limpia event listeners por patrón
   */
  limpiarEventListenersPorPatron(patron) {
    const keysToDelete = [];
    
    this.eventListeners.forEach((cleanup, key) => {
      if (key.includes(patron)) {
        cleanup();
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.eventListeners.delete(key));
  }

  /**
   * Limpia todos los event listeners
   */
  limpiarEventListeners() {
    const count = this.eventListeners.size;
    
    this.eventListeners.forEach((cleanup, key) => {
      try {
        cleanup();
      } catch (error) {
        console.warn(`⚠️ OverlayManager[${this.tipo}]: Error limpiando listener ${key}:`, error);
      }
    });
    
    this.eventListeners.clear();
    
    if (count > 0) {
      console.log(`🧹 OverlayManager[${this.tipo}]: ${count} event listeners limpiados`);
    }
  }

  /**
   * Limpia un overlay específico
   */
  limpiarOverlay(numeroPagina) {
    const overlay = this.overlays.get(numeroPagina);
    if (!overlay) return;

    // Preservar elementos persistentes
    const elementosPersistentes = overlay.querySelectorAll('[data-persistent="true"]');
    const persistentesAPreservar = [];
    
    elementosPersistentes.forEach(elemento => {
      if (elemento.dataset.persistentType === this.tipo) {
        const parent = elemento.parentNode;
        if (parent) {
          elemento.remove();
          persistentesAPreservar.push({ elemento, parent });
        }
      }
    });

    // Limpiar event listeners asociados
    const keysToDelete = [];
    this.eventListeners.forEach((cleanup, key) => {
      if (key.includes(`${this.tipo}-${numeroPagina}-`)) {
        cleanup();
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.eventListeners.delete(key));

    // Remover overlay del DOM
    if (overlay.parentNode) {
      overlay.remove();
    }
    
    this.overlays.delete(numeroPagina);

    if (persistentesAPreservar.length > 0) {
      console.log(`🔄 OverlayManager[${this.tipo}]: ${persistentesAPreservar.length} elementos persistentes preservados`);
    }
    
    console.log(`🗑️ OverlayManager[${this.tipo}]: Overlay de página ${numeroPagina} limpiado`);
  }

  /**
   * Obtiene overlay de una página
   */
  getOverlay(numeroPagina) {
    const overlay = this.overlays.get(numeroPagina);
    
    if (overlay && (!overlay.parentNode || overlay.dataset.herramienta !== this.tipo)) {
      console.warn(`⚠️ OverlayManager[${this.tipo}]: Overlay inválido detectado para página ${numeroPagina}`);
      this.overlays.delete(numeroPagina);
      return null;
    }
    
    return overlay;
  }

  /**
   * Verifica si una página tiene overlay válido
   */
  tieneOverlay(numeroPagina) {
    const overlay = this.getOverlay(numeroPagina);
    return overlay && overlay.parentNode;
  }

  /**
   * Limpia overlays huérfanos
   */
  limpiarOverlaysHuerfanos() {
    const ahora = Date.now();
    if (ahora - this.lastCleanup < 2000) return; // Debounce más largo
    
    this.lastCleanup = ahora;
    const huerfanos = [];

    this.overlays.forEach((overlay, numeroPagina) => {
      if (!overlay.parentNode || overlay.dataset.herramienta !== this.tipo) {
        huerfanos.push(numeroPagina);
      }
    });

    huerfanos.forEach(numeroPagina => {
      console.log(`🗑️ OverlayManager[${this.tipo}]: Limpiando overlay huérfano de página ${numeroPagina}`);
      this.limpiarOverlay(numeroPagina);
    });

    if (huerfanos.length > 0) {
      this.cachedPages = [];
      this.lastPageSearch = 0;
    }
  }

  /**
   * Actualizar escala (para futuro uso)
   */
  actualizarEscala(nuevaEscala) {
    if (this.scaleCache === nuevaEscala) return;
    
    this.scaleCache = nuevaEscala;
    console.log(`🔍 OverlayManager[${this.tipo}]: Escala actualizada a ${nuevaEscala}`);
    
    // Los elementos con coordenadas relativas (%) se escalan automáticamente
    // Pero podríamos notificar a elementos específicos si es necesario
  }

  /**
   * Destruye completamente el manager
   */
  destruir() {
    console.log(`💥 OverlayManager[${this.tipo}]: Destruyendo...`);
    
    this.limpiarEventListeners();
    
    this.overlays.forEach((overlay, numeroPagina) => {
      this.limpiarOverlay(numeroPagina);
    });
    
    this.overlays.clear();
    this.cachedPages = [];
    this.isActive = false;
    
    console.log(`✅ OverlayManager[${this.tipo}]: Destruido completamente`);
  }

  /**
   * Configuración específica optimizada para textos
   */
  getZIndex() {
    return this.tipo === 'texto' ? 150 : 50;
  }

  getCursor() {
    return this.tipo === 'texto' ? 'text' : 'default';
  }

  getDebugColor() {
    return this.tipo === 'texto' ? '33, 150, 243' : '128, 128, 128';
  }

  /**
   * Estado actual del manager
   */
  getEstado() {
    return {
      tipo: this.tipo,
      activo: this.isActive,
      overlays: this.overlays.size,
      eventListeners: this.eventListeners.size,
      paginasConOverlay: Array.from(this.overlays.keys()),
      paginasEnCache: this.cachedPages.length,
      escala: this.scaleCache,
      version: 'v3-textos'
    };
  }
}

/**
 * Hook para usar OverlayManager estabilizado
 */
export const useOverlayManager = (tipoHerramienta) => {
  const managerRef = React.useRef(null);
  const isInitialized = React.useRef(false);
  const componentMounted = React.useRef(true);

  React.useMemo(() => {
    if (!managerRef.current && !isInitialized.current && componentMounted.current) {
      managerRef.current = new OverlayManager(tipoHerramienta);
      isInitialized.current = true;
      console.log(`🎨 useOverlayManager[${tipoHerramienta}]: Manager creado v3`);
    }
  }, [tipoHerramienta]);

  React.useEffect(() => {
    componentMounted.current = true;
    
    return () => {
      componentMounted.current = false;
      
      setTimeout(() => {
        if (!componentMounted.current && managerRef.current && isInitialized.current) {
          console.log(`💥 useOverlayManager[${tipoHerramienta}]: Cleanup definitivo v3`);
          managerRef.current.destruir();
          managerRef.current = null;
          isInitialized.current = false;
        }
      }, 200);
    };
  }, [tipoHerramienta]);

  return managerRef.current;
};

/**
 * Hook para gestión automática de overlays optimizado
 */
export const useAutoOverlays = (manager, activo, visorInfo = {}) => {
  const [overlaysCreados, setOverlaysCreados] = React.useState(0);
  const lastCreationRef = React.useRef(0);
  const [pdfListo, setPdfListo] = React.useState(false);
  const checkIntervalRef = React.useRef(null);

  // Detectar cuándo el PDF está listo
  React.useEffect(() => {
    const verificarPDFListo = () => {
      const strategias = [
        () => document.querySelectorAll('.rpv-core__inner-page').length > 0,
        () => document.querySelectorAll('.dual-canvas').length > 0,
        () => document.querySelectorAll('.visor-pdf canvas').length > 0,
        () => {
          const viewer = document.querySelector('.rpv-core__viewer');
          return viewer && viewer.scrollHeight > 100;
        }
      ];

      const isReady = strategias.some(strategy => {
        try {
          return strategy();
        } catch {
          return false;
        }
      }) && document.readyState === 'complete';
      
      if (isReady && !pdfListo) {
        console.log(`✅ PDF listo detectado para ${manager?.tipo || 'unknown'}`);
        setPdfListo(true);
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      } else if (!isReady && pdfListo) {
        console.log(`⚠️ PDF ya no está listo para ${manager?.tipo || 'unknown'}`);
        setPdfListo(false);
      }
    };

    verificarPDFListo();

    if (!pdfListo) {
      checkIntervalRef.current = setInterval(verificarPDFListo, 1000);
    }

    const observer = new MutationObserver(verificarPDFListo);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    const handleReadyStateChange = () => {
      verificarPDFListo();
    };
    document.addEventListener('readystatechange', handleReadyStateChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('readystatechange', handleReadyStateChange);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [pdfListo, manager?.tipo]);

  // Crear overlays cuando el PDF esté listo
  React.useEffect(() => {
    if (visorInfo.mode === 'dual') return;
    if (!manager || !pdfListo) return;

    const crearOverlays = async () => {
      console.log(`🔄 useAutoOverlays[${manager.tipo}]: Creando overlays...`);
      
      try {
        const paginas = await manager.buscarPaginas();
        console.log(`📄 useAutoOverlays[${manager.tipo}]: ${paginas.length} páginas encontradas`);
        
        if (paginas.length === 0) {
          console.warn(`⚠️ useAutoOverlays[${manager.tipo}]: No se encontraron páginas`);
          return;
        }

        let contadorCreados = 0;

        paginas.forEach((paginaElement, index) => {
          const numeroPagina = index + 1;
          const overlay = manager.asegurarOverlay(paginaElement, numeroPagina);
          if (overlay) {
            contadorCreados++;
          }
        });

        setOverlaysCreados(contadorCreados);
        lastCreationRef.current = Date.now();
        
        setTimeout(() => {
          manager.limpiarOverlaysHuerfanos();
        }, 100);
        
        console.log(`✅ useAutoOverlays[${manager.tipo}]: ${contadorCreados} overlays creados`);
      } catch (error) {
        console.error(`❌ useAutoOverlays[${manager.tipo}]: Error creando overlays:`, error);
      }
    };

    const ahora = Date.now();
    if (ahora - lastCreationRef.current < 1000) {
      return;
    }

    crearOverlays();
    manager.setActive(activo);
  }, [manager, activo, visorInfo.mode, visorInfo.scale, pdfListo]);

  return { overlaysCreados, pdfListo };
};

export default OverlayManager;
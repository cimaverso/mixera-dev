// PersistentRenderer.js - CORRECCIÓN CRÍTICA DE EVENTOS v3
import React from 'react';

/**
 * PROBLEMA IDENTIFICADO:
 * - Los elementos se crean pero pierden eventos
 * - La sincronización está borrando elementos existentes
 * - Los eventos no se re-registran correctamente
 */

class PersistentRenderer {
  constructor(tipo) {
    this.tipo = tipo;
    this.elementosRenderizados = new Map();
    this.paginasInicializadas = new Set();
    this.isActive = false;
    this.eventListeners = new Map();
    this.scaleCache = 1.0;
    
    console.log(`🎨 PersistentRenderer[${this.tipo}]: Inicializado con corrección de eventos`);
  }

  // CORREGIDO: No recrear elementos que ya existen
  asegurarElemento(id, datos, numeroPagina, overlay) {
    const idStr = id.toString();
    let elemento = this.elementosRenderizados.get(idStr);
    
    // CRÍTICO: Solo crear si realmente no existe
    if (!elemento || !elemento.parentNode || !document.contains(elemento)) {
      console.log(`🆕 Creando nuevo elemento: ${idStr}`);
      elemento = this.crearElemento(datos, numeroPagina, overlay);
      if (elemento) {
        overlay.appendChild(elemento);
        this.elementosRenderizados.set(idStr, elemento);
      }
    } else {
      // CRÍTICO: Solo actualizar datos, NO recrear
      console.log(`🔄 Actualizando elemento existente: ${idStr}`);
      this.actualizarElemento(elemento, datos);
    }
    
    this.configurarInteraccion(elemento, datos);
    return elemento;
  }

  crearElemento(datos, numeroPagina, overlay) {
    throw new Error(`crearElemento debe ser implementado en subclase de ${this.tipo}`);
  }

  actualizarElemento(elemento, datos) {
    throw new Error(`actualizarElemento debe ser implementado en subclase de ${this.tipo}`);
  }

  configurarInteraccion(elemento, datos) {
    if (!elemento) return;
    
    elemento.style.display = '';
    elemento.style.visibility = 'visible';
    elemento.style.pointerEvents = this.isActive ? 'auto' : 'none';
    
    elemento.setAttribute('data-interactive', this.isActive.toString());
    elemento.setAttribute('data-tool', this.tipo);
    elemento.setAttribute('data-persistent', 'true');
    
    if (this.isActive) {
      this.activarEventos(elemento, datos);
    } else {
      this.desactivarEventos(elemento);
    }
  }

  activarEventos(elemento, datos) {
    // Implementar en subclases
  }

  desactivarEventos(elemento) {
    // Implementar en subclases
  }

  setActive(activo) {
    if (this.isActive === activo) return;
    
    this.isActive = activo;
    console.log(`🔄 PersistentRenderer[${this.tipo}]: ${activo ? 'ACTIVADO' : 'DESACTIVADO'}`);
    
    this.elementosRenderizados.forEach((elemento, id) => {
      if (elemento && elemento.parentNode) {
        const datos = this.extraerDatos(elemento);
        this.configurarInteraccion(elemento, datos);
      }
    });
  }

  extraerDatos(elemento) {
    return {};
  }

  // CRÍTICO: Sincronizar SIN destruir elementos existentes
  sincronizar(listaActual, overlaysPorPagina) {
    const idsActuales = new Set(listaActual.map(item => item.id.toString()));
    const idsRenderizados = new Set(this.elementosRenderizados.keys());
    
    console.log(`🔄 PersistentRenderer[${this.tipo}]: Sincronización NO DESTRUCTIVA`, {
      elementosActuales: listaActual.length,
      elementosRenderizados: idsRenderizados.size,
      nuevosElementos: listaActual.filter(item => !idsRenderizados.has(item.id.toString())).length
    });
    
    // 1. CREAR elementos nuevos ÚNICAMENTE
    listaActual.forEach(item => {
      const idStr = item.id.toString();
      if (!idsRenderizados.has(idStr)) {
        const overlay = overlaysPorPagina.get(item.pagina);
        if (overlay) {
          console.log(`🆕 Creando elemento nuevo: ${idStr}`);
          this.asegurarElemento(idStr, item, item.pagina, overlay);
        }
      }
    });
    
    // 2. ACTUALIZAR elementos existentes ÚNICAMENTE
    listaActual.forEach(item => {
      const idStr = item.id.toString();
      if (idsRenderizados.has(idStr)) {
        const elemento = this.elementosRenderizados.get(idStr);
        if (elemento && elemento.parentNode) {
          console.log(`🔄 Actualizando elemento: ${idStr}`);
          this.actualizarElemento(elemento, item);
          this.configurarInteraccion(elemento, item);
        }
      }
    });
    
    // 3. OCULTAR (NO eliminar) elementos que ya no están en la lista
    idsRenderizados.forEach(id => {
      if (!idsActuales.has(id)) {
        const elemento = this.elementosRenderizados.get(id);
        if (elemento && elemento.parentNode) {
          console.log(`👻 Ocultando elemento removido: ${id}`);
          elemento.style.display = 'none';
          this.desactivarEventos(elemento);
          // NO remover del Map para evitar recreaciones
        }
      }
    });
    
    console.log(`✅ PersistentRenderer[${this.tipo}]: Sincronización completada sin destrucción`);
  }

  getElemento(id) {
    return this.elementosRenderizados.get(id.toString());
  }

  tieneElemento(id) {
    const elemento = this.getElemento(id);
    return elemento && elemento.parentNode && elemento.style.display !== 'none';
  }

  registrarEventListener(elemento, evento, handler, opciones = {}) {
    if (!elemento) return () => {};
    
    const key = `${elemento.dataset.persistentId || elemento.dataset.textoId || Date.now()}-${evento}`;
    
    this.limpiarEventListener(key);
    
    try {
      elemento.addEventListener(evento, handler, opciones);
      
      const cleanup = () => {
        if (elemento && elemento.removeEventListener) {
          elemento.removeEventListener(evento, handler, opciones);
        }
      };
      
      this.eventListeners.set(key, cleanup);
      return cleanup;
    } catch (error) {
      console.error(`❌ PersistentRenderer[${this.tipo}]: Error registrando evento ${evento}:`, error);
      return () => {};
    }
  }

  limpiarEventListener(key) {
    const cleanup = this.eventListeners.get(key);
    if (cleanup) {
      try {
        cleanup();
        this.eventListeners.delete(key);
      } catch (error) {
        console.warn(`⚠️ PersistentRenderer[${this.tipo}]: Error limpiando listener ${key}:`, error);
      }
    }
  }

  limpiarTodosLosEventListeners() {
    console.log(`🧹 PersistentRenderer[${this.tipo}]: Limpiando ${this.eventListeners.size} event listeners`);
    
    this.eventListeners.forEach((cleanup, key) => {
      try {
        cleanup();
      } catch (error) {
        console.warn(`⚠️ PersistentRenderer[${this.tipo}]: Error limpiando listener ${key}:`, error);
      }
    });
    this.eventListeners.clear();
  }

  destruir() {
    console.log(`💥 PersistentRenderer[${this.tipo}]: Destruyendo...`);
    
    this.limpiarTodosLosEventListeners();
    
    this.elementosRenderizados.forEach((elemento, id) => {
      if (elemento && elemento.parentNode) {
        try {
          elemento.remove();
        } catch (error) {
          console.warn(`⚠️ PersistentRenderer[${this.tipo}]: Error removiendo elemento ${id}:`, error);
        }
      }
    });
    
    this.elementosRenderizados.clear();
    this.paginasInicializadas.clear();
    this.isActive = false;
    
    console.log(`✅ PersistentRenderer[${this.tipo}]: Destruido completamente`);
  }
}

/**
 * TextosPersistentRenderer - CORREGIDO PARA NO PERDER EVENTOS
 */
class TextosPersistentRenderer extends PersistentRenderer {
  constructor() {
    super('texto');
    this.DIMENSIONES = {
      MIN_WIDTH: 100,
      MAX_WIDTH: 450,
      MIN_HEIGHT: 40,
      MAX_HEIGHT: 350,
      DEFAULT_WIDTH: 150,
      DEFAULT_HEIGHT: 50
    };
  }

  validarDimensiones(width, height) {
    const inputWidth = width || this.DIMENSIONES.DEFAULT_WIDTH;
    const inputHeight = height || this.DIMENSIONES.DEFAULT_HEIGHT;
    
    const validWidth = Math.max(this.DIMENSIONES.MIN_WIDTH, Math.min(this.DIMENSIONES.MAX_WIDTH, inputWidth));
    const validHeight = Math.max(this.DIMENSIONES.MIN_HEIGHT, Math.min(this.DIMENSIONES.MAX_HEIGHT, inputHeight));
    
    return { width: validWidth, height: validHeight };
  }

  crearElemento(texto, numeroPagina, overlay) {
    const { width, height } = this.validarDimensiones(texto.width, texto.height);
    
    console.log(`🎨 Creando elemento texto: ${texto.id}`);
    
    const textoContainer = document.createElement('div');
    textoContainer.className = 'texto-container persistent-texto texto-transparente';
    textoContainer.setAttribute('data-texto-id', texto.id.toString());
    textoContainer.dataset.paginaTexto = numeroPagina.toString();
    textoContainer.dataset.persistentType = 'texto';
    textoContainer.dataset.persistentId = `texto-${texto.id}`;
    
    // CRÍTICO: Marcar como interactivo desde el inicio
    textoContainer.dataset.interactive = 'true';
    
    textoContainer.style.cssText = `
      position: absolute;
      left: ${texto.x * 100}%;
      top: ${texto.y * 100}%;
      transform: translate(-50%, -50%);
      z-index: 210;
      width: ${width}px;
      height: ${height}px;
      max-width: ${this.DIMENSIONES.MAX_WIDTH}px;
      max-height: ${this.DIMENSIONES.MAX_HEIGHT}px;
      min-width: ${this.DIMENSIONES.MIN_WIDTH}px;
      min-height: ${this.DIMENSIONES.MIN_HEIGHT}px;
      box-sizing: border-box;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.2s ease;
      overflow: hidden;
    `;

    const textoElement = document.createElement('div');
    textoElement.className = 'texto-existente texto-elemento texto-transparente-elemento';
    textoElement.style.cssText = `
      width: 100%;
      height: 100%;
      cursor: inherit;
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      background: transparent;
      color: #1a1a1a;
      padding: 8px 12px;
      border-radius: 6px;
      border: 2px solid transparent;
      box-shadow: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      word-wrap: break-word;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      hyphens: auto;
      position: relative;
      box-sizing: border-box;
      line-height: 1.4;
      text-shadow: 0 0 3px rgba(255,255,255,0.8);
      outline: none;
    `;
    
    textoElement.textContent = texto.texto;
    textoContainer.appendChild(textoElement);
    
    console.log(`✅ Elemento texto creado: ${texto.id}`);
    return textoContainer;
  }

  actualizarElemento(elemento, texto) {
    const { width, height } = this.validarDimensiones(texto.width, texto.height);
    
    console.log(`🔄 Actualizando elemento: ${texto.id}`);
    
    // CRÍTICO: Solo actualizar si los valores realmente cambiaron
    if (elemento.style.left !== `${texto.x * 100}%`) {
      elemento.style.left = `${texto.x * 100}%`;
    }
    if (elemento.style.top !== `${texto.y * 100}%`) {
      elemento.style.top = `${texto.y * 100}%`;
    }
    if (elemento.style.width !== `${width}px`) {
      elemento.style.width = `${width}px`;
    }
    if (elemento.style.height !== `${height}px`) {
      elemento.style.height = `${height}px`;
    }
    
    // Actualizar contenido solo si cambió
    const textoElement = elemento.querySelector('.texto-elemento');
    if (textoElement && textoElement.textContent !== texto.texto) {
      textoElement.textContent = texto.texto;
    }
    
    // CRÍTICO: Asegurar visibilidad y interactividad
    elemento.style.display = '';
    elemento.style.visibility = 'visible';
    elemento.style.pointerEvents = 'auto';
    
    console.log(`✅ Elemento actualizado: ${texto.id}`);
  }

  // CRÍTICO: Eventos hover simplificados pero efectivos
  activarEventos(elemento, texto) {
    if (!elemento) return;
    
    const textoId = texto?.id || elemento.dataset.textoId;
    console.log(`🎧 Activando eventos para texto: ${textoId}`);
    
    elemento.style.cursor = 'pointer';
    elemento.style.pointerEvents = 'auto';
    
    const textoElement = elemento.querySelector('.texto-elemento');
    if (!textoElement) return;
    
    // Eventos hover básicos
    const handleMouseEnter = () => {
      if (this.isActive) {
        textoElement.style.background = 'rgba(33, 150, 243, 0.05)';
        textoElement.style.borderColor = 'rgba(33, 150, 243, 0.3)';
        textoElement.style.borderStyle = 'dashed';
        textoElement.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.15)';
        elemento.style.zIndex = '220';
      }
    };
    
    const handleMouseLeave = () => {
      if (this.isActive) {
        textoElement.style.background = 'transparent';
        textoElement.style.borderColor = 'transparent';
        textoElement.style.borderStyle = 'solid';
        textoElement.style.boxShadow = 'none';
        elemento.style.zIndex = '210';
      }
    };
    
    // Registrar eventos
    this.registrarEventListener(elemento, 'mouseenter', handleMouseEnter);
    this.registrarEventListener(elemento, 'mouseleave', handleMouseLeave);
    
    console.log(`✅ Eventos activados para texto: ${textoId}`);
  }

  desactivarEventos(elemento) {
    if (!elemento) return;
    
    console.log(`🔇 Desactivando eventos para elemento`);
    
    elemento.style.cursor = 'default';
    elemento.style.pointerEvents = 'none';
    
    const textoElement = elemento.querySelector('.texto-elemento');
    if (textoElement) {
      textoElement.style.background = 'transparent';
      textoElement.style.borderColor = 'transparent';
      textoElement.style.borderStyle = 'solid';
      textoElement.style.boxShadow = 'none';
      elemento.style.zIndex = '210';
    }
    
    // Los event listeners se limpian automáticamente por el sistema base
  }

  extraerDatos(elemento) {
    const textoId = elemento.getAttribute('data-texto-id');
    return { id: textoId };
  }
}

/**
 * Hook para usar PersistentRenderer corregido
 */
export const usePersistentRenderer = (tipo) => {
  const rendererRef = React.useRef(null);

  if (!rendererRef.current) {
    if (tipo === 'texto') {
      rendererRef.current = new TextosPersistentRenderer();
    } else {
      console.error(`❌ usePersistentRenderer: Tipo no válido: ${tipo}`);
      return null;
    }
    console.log(`🎨 usePersistentRenderer[${tipo}]: Renderer corregido creado`);
  }

  React.useEffect(() => {
    const renderer = rendererRef.current;
    
    return () => {
      if (renderer) {
        console.log(`💥 usePersistentRenderer[${tipo}]: Ejecutando cleanup`);
        renderer.destruir();
        rendererRef.current = null;
      }
    };
  }, [tipo]);

  return rendererRef.current;
};

export default PersistentRenderer;
export { PersistentRenderer, TextosPersistentRenderer };
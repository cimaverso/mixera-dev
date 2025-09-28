// src/Componentes/Lector/anotaciones/index.js

/**
 * Archivo indice para exportar todos los tipos de anotaciones
 * Facilita las importaciones y organiza los componentes de anotaciones
 */

// Componentes de anotaciones actuales
export { default as TextoAnotacion } from './TextoAnotacion';

// Componentes futuros (comentados hasta implementar)
// export { default as SubrayadoAnotacion } from './SubrayadoAnotacion';
// export { default as DibujoAnotacion } from './DibujoAnotacion';
// export { default as NotaAnotacion } from './NotaAnotacion';
// export { default as FormularioAnotacion } from './FormularioAnotacion';

/**
 * Tipos de anotaciones soportados
 */
export const TIPOS_ANOTACION = {
  TEXTO: 'texto',
  SUBRAYADO: 'subrayado',
  DIBUJO: 'dibujo',
  NOTA: 'nota',
  FORMULARIO: 'formulario'
};

/**
 * Configuraciones por defecto para cada tipo de anotacion
 */
export const CONFIGURACIONES_DEFECTO = {
  [TIPOS_ANOTACION.TEXTO]: {
    dimensiones: {
      ancho: 200,
      alto: 60
    },
    contenido: {
      texto: 'Nuevo texto',
      fontSize: 14,
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      fontStyle: 'normal'
    },
    estilo: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#de007e',
      borderWidth: 1,
      borderRadius: 4,
      padding: 6
    }
  },
  
  [TIPOS_ANOTACION.SUBRAYADO]: {
    dimensiones: {
      ancho: 100,
      alto: 20
    },
    contenido: {
      color: '#ffff00',
      opacity: 0.5,
      grosor: 4
    },
    estilo: {
      borderRadius: 2
    }
  },
  
  [TIPOS_ANOTACION.DIBUJO]: {
    dimensiones: {
      ancho: 150,
      alto: 150
    },
    contenido: {
      trazo: {
        color: '#de007e',
        grosor: 2,
        estilo: 'solid'
      },
      relleno: {
        color: 'transparent',
        opacity: 1
      }
    },
    estilo: {
      cursor: 'crosshair'
    }
  }
};

/**
 * Utilidad para crear una nueva anotacion con valores por defecto
 */
export const crearAnotacionDefecto = (tipo, posicion, pagina) => {
  const config = CONFIGURACIONES_DEFECTO[tipo];
  
  if (!config) {
    throw new Error(`Tipo de anotacion no soportado: ${tipo}`);
  }

  return {
    id: `temp_${tipo}_${Date.now()}`,
    tipo,
    pagina,
    posicion: {
      x: posicion.x,
      y: posicion.y
    },
    dimensiones: {
      ancho: config.dimensiones.ancho,
      alto: config.dimensiones.alto
    },
    contenido: { ...config.contenido },
    estilo: { ...config.estilo },
    metadatos: {
      creado: new Date().toISOString(),
      modificado: new Date().toISOString(),
      esNueva: true,
      editando: true,
      version: 1
    }
  };
};

/**
 * Valida si una anotacion tiene la estructura correcta
 */
export const validarAnotacion = (anotacion) => {
  const camposRequeridos = ['id', 'tipo', 'pagina', 'posicion', 'dimensiones', 'contenido'];
  
  for (const campo of camposRequeridos) {
    if (!anotacion[campo]) {
      return { valida: false, error: `Campo requerido faltante: ${campo}` };
    }
  }
  
  // Validar tipo
  if (!Object.values(TIPOS_ANOTACION).includes(anotacion.tipo)) {
    return { valida: false, error: `Tipo de anotacion no valido: ${anotacion.tipo}` };
  }
  
  // Validar posicion
  if (typeof anotacion.posicion.x !== 'number' || typeof anotacion.posicion.y !== 'number') {
    return { valida: false, error: 'Posicion debe contener coordenadas numericas' };
  }
  
  // Validar dimensiones
  if (typeof anotacion.dimensiones.ancho !== 'number' || typeof anotacion.dimensiones.alto !== 'number') {
    return { valida: false, error: 'Dimensiones deben ser numericas' };
  }
  
  return { valida: true };
};

/**
 * Utilidad para calcular el area ocupada por una anotacion
 */
export const calcularAreaAnotacion = (anotacion) => {
  return anotacion.dimensiones.ancho * anotacion.dimensiones.alto;
};

/**
 * Utilidad para verificar si dos anotaciones se superponen
 */
export const verificarSuperposicion = (anotacion1, anotacion2) => {
  const a1 = {
    x1: anotacion1.posicion.x,
    y1: anotacion1.posicion.y,
    x2: anotacion1.posicion.x + anotacion1.dimensiones.ancho,
    y2: anotacion1.posicion.y + anotacion1.dimensiones.alto
  };
  
  const a2 = {
    x1: anotacion2.posicion.x,
    y1: anotacion2.posicion.y,
    x2: anotacion2.posicion.x + anotacion2.dimensiones.ancho,
    y2: anotacion2.posicion.y + anotacion2.dimensiones.alto
  };
  
  return !(a1.x2 < a2.x1 || a2.x2 < a1.x1 || a1.y2 < a2.y1 || a2.y2 < a1.y1);
};

/**
 * Utilidad para organizar anotaciones por Z-index
 */
export const organizarPorZIndex = (anotaciones, anotacionSeleccionada) => {
  return [...anotaciones].sort((a, b) => {
    // Anotacion seleccionada siempre encima
    if (a.id === anotacionSeleccionada) return 1;
    if (b.id === anotacionSeleccionada) return -1;
    
    // Ordenar por fecha de creacion (mas recientes encima)
    return new Date(b.metadatos.creado) - new Date(a.metadatos.creado);
  });
};
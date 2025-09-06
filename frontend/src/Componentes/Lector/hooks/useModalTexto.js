// useModalTexto.js - CORREGIDO - Sin errores DOM
import { useState, useCallback } from 'react';

export function useModalTexto() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [textoEditando, setTextoEditando] = useState(null);
  const [guardandoTexto, setGuardandoTexto] = useState(false);

  // Abrir modal para crear nuevo texto con backend
  const abrirModalCreacion = useCallback((numeroPagina, x, y, onAddTexto, onDesactivarHerramienta) => {
    if (modalAbierto || guardandoTexto) {
      console.warn('Modal ya existe o hay texto guardando, ignorando');
      return null;
    }

    console.log('Abriendo modal de creación:', { numeroPagina, x, y });
    setModalAbierto(true);
    
    return {
      titulo: `Nuevo texto - Página ${numeroPagina}`,
      valor: '',
      fontSize: 14,
      width: 300,
      height: 120,
      onGuardar: async (texto, fontSize, modalWidth, modalHeight) => {
        try {
          console.log('Guardando nuevo texto con backend:', {
            texto: texto.substring(0, 30) + '...',
            fontSize,
            modalWidth,
            modalHeight
          });

          // CRÍTICO: onAddTexto devuelve Promise del backend
          await onAddTexto({ 
            pagina: numeroPagina, 
            x, 
            y, 
            texto, 
            width: modalWidth || 300,
            height: modalHeight || 120,
            fontSize: fontSize || 14
          });

          console.log('Texto creado exitosamente en backend');
          cerrarModal();
          onDesactivarHerramienta();
        } catch (error) {
          console.error('Error creando texto en backend:', error);
          throw error; // Re-lanzar para que el modal lo maneje
        }
      },
      onCancelar: () => {
        console.log('Cancelando creación de texto');
        cerrarModal();
        onDesactivarHerramienta();
      }
    };
  }, [modalAbierto, guardandoTexto]);

  // Abrir modal para editar texto existente con backend
  const abrirModalEdicion = useCallback((texto, onEditTexto, onDeleteTexto, onDesactivarHerramienta) => {
    if (modalAbierto || guardandoTexto) {
      console.warn('Modal ya existe o hay texto guardando, ignorando');
      return null;
    }

    console.log('Abriendo modal de edición:', texto.id);
    setModalAbierto(true);
    setTextoEditando(texto.id);
    
    return {
      titulo: `Editar texto - Página ${texto.pagina}`,
      valor: texto.texto,
      fontSize: texto.fontSize || 14,
      width: texto.width || 300,
      height: texto.height || 120,
      onGuardar: async (nuevoTexto, fontSize, modalWidth, modalHeight) => {
        try {
          console.log('Guardando edición con backend:', {
            id: texto.id,
            nuevoTexto: nuevoTexto.substring(0, 30) + '...',
            fontSize,
            modalWidth,
            modalHeight
          });

          // CRÍTICO: onEditTexto devuelve Promise del backend
          await onEditTexto({ 
            id: texto.id, 
            texto: nuevoTexto,
            x: texto.x,
            y: texto.y,
            width: modalWidth || texto.width,
            height: modalHeight || texto.height,
            pagina: texto.pagina,
            fontSize: fontSize || 14
          });

          console.log('Texto editado exitosamente en backend');
          cerrarModal();
          onDesactivarHerramienta();
        } catch (error) {
          console.error('Error editando texto en backend:', error);
          throw error; // Re-lanzar para que el modal lo maneje
        }
      },
      onCancelar: () => {
        console.log('Cancelando edición de texto');
        cerrarModal();
      },
      onEliminar: async () => {
        try {
          console.log('Eliminando texto con backend:', texto.id);

          // CRÍTICO: onDeleteTexto devuelve Promise del backend
          await onDeleteTexto(texto.id);

          console.log('Texto eliminado exitosamente en backend');
          cerrarModal();
          onDesactivarHerramienta();
        } catch (error) {
          console.error('Error eliminando texto en backend:', error);
          throw error; // Re-lanzar para que el modal lo maneje
        }
      }
    };
  }, [modalAbierto, guardandoTexto]);

  // CORREGIDO: Cerrar modal sin errores DOM
  const cerrarModal = useCallback(() => {
    console.log('Cerrando modal de texto');
    
    // CORREGIDO: No intentar manipular DOM directamente
    // Solo cambiar el estado React
    setModalAbierto(false);
    setTextoEditando(null);
    setGuardandoTexto(false);
    
    // CORREGIDO: Limpiar cualquier modal legacy de forma segura
    setTimeout(() => {
      try {
        const modalExistente = document.querySelector('.modal-texto-con-fuente');
        if (modalExistente && modalExistente.parentNode) {
          modalExistente.parentNode.removeChild(modalExistente);
        }
      } catch (error) {
        // Ignorar errores de DOM - el modal ya no existe
        console.debug('Modal ya fue removido del DOM');
      }
    }, 100);
  }, []);

  // Controlar estado de guardado
  const setEstadoGuardando = useCallback((estado) => {
    setGuardandoTexto(estado);
  }, []);

  return {
    modalAbierto,
    textoEditando,
    guardandoTexto,
    abrirModalCreacion,
    abrirModalEdicion,
    cerrarModal,
    setEstadoGuardando
  };
}
// useWelcomeModal.js - Hook para manejar la lógica de la ventana de bienvenida
import { useState, useEffect } from 'react';

export const useWelcomeModal = () => {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Clave para localStorage
  const STORAGE_KEY = 'lector_welcome_dismissed';

  // Verificar si el usuario ya ha visto la ventana
  const checkWelcomeModalStatus = () => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      const shouldShow = dismissed !== 'true';
      
      console.log('Estado ventana de bienvenida:', {
        dismissed,
        shouldShow,
        storageAvailable: typeof(Storage) !== "undefined"
      });
      
      return shouldShow;
    } catch (error) {
      console.warn('Error accediendo a localStorage para ventana de bienvenida:', error);
      // Si hay error con localStorage, mostrar la ventana por defecto
      return true;
    }
  };

  // Marcar la ventana como vista (por si se cierra sin el checkbox)
  const markAsViewed = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      console.log('Ventana de bienvenida marcada como vista');
    } catch (error) {
      console.warn('No se pudo marcar la ventana como vista en localStorage:', error);
    }
  };

  // Resetear la preferencia (útil para testing o configuración)
  const resetWelcomeModal = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Preferencia de ventana de bienvenida reseteada');
      setShowWelcomeModal(true);
    } catch (error) {
      console.warn('No se pudo resetear la preferencia en localStorage:', error);
    }
  };

  // Verificar al montar el componente
  useEffect(() => {
    // Pequeño delay para asegurar que el lector esté completamente cargado
    const timer = setTimeout(() => {
      const shouldShow = checkWelcomeModalStatus();
      setShowWelcomeModal(shouldShow);
      setIsInitialized(true);
      
      if (shouldShow) {
        console.log('Mostrando ventana de bienvenida en lector');
      } else {
        console.log('Ventana de bienvenida omitida (ya fue vista)');
      }
    }, 1000); // 1 segundo de delay para que se cargue bien el lector

    return () => clearTimeout(timer);
  }, []);

  // Función para cerrar la ventana
  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    console.log('Ventana de bienvenida cerrada por el usuario');
  };

  // Verificar si localStorage está disponible
  const isLocalStorageAvailable = () => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    // Estado
    showWelcomeModal,
    isInitialized,
    
    // Acciones
    closeWelcomeModal,
    markAsViewed,
    resetWelcomeModal,
    
    // Utilidades
    checkWelcomeModalStatus,
    isLocalStorageAvailable: isLocalStorageAvailable(),
    
    // Info de debugging
    storageKey: STORAGE_KEY
  };
};
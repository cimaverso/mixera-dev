// useProfileWelcome.js - Hook para manejar la lógica de la ventana de bienvenida del perfil
import { useState, useEffect } from 'react';

export const useProfileWelcome = () => {
  const [showProfileWelcome, setShowProfileWelcome] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Clave para localStorage
  const STORAGE_KEY = 'profile_welcome_dismissed';

  // Verificar si el usuario ya ha visto la ventana
  const checkProfileWelcomeStatus = () => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      const shouldShow = dismissed !== 'true';
      return shouldShow;
    } catch (error) {
      // Si hay error con localStorage, mostrar la ventana por defecto
      return true;
    }
  };

  // Marcar la ventana como vista (por si se cierra sin el checkbox)
  const markAsViewed = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (error) {
      // Error silencioso
    }
  };

  // Resetear la preferencia (útil para testing o configuración)
  const resetProfileWelcome = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setShowProfileWelcome(true);
    } catch (error) {
      // Error silencioso
    }
  };

  // Verificar al montar el componente
  useEffect(() => {
    // Pequeño delay para asegurar que el perfil esté completamente cargado
    const timer = setTimeout(() => {
      const shouldShow = checkProfileWelcomeStatus();
      setShowProfileWelcome(shouldShow);
      setIsInitialized(true);
    }, 800); // 0.8 segundos de delay para que se cargue bien el perfil

    return () => clearTimeout(timer);
  }, []);

  // Función para cerrar la ventana
  const closeProfileWelcome = () => {
    setShowProfileWelcome(false);
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
    showProfileWelcome,
    isInitialized,
    
    // Acciones
    closeProfileWelcome,
    markAsViewed,
    resetProfileWelcome,
    
    // Utilidades
    checkProfileWelcomeStatus,
    isLocalStorageAvailable: isLocalStorageAvailable(),
    
    // Info de debugging
    storageKey: STORAGE_KEY
  };
};
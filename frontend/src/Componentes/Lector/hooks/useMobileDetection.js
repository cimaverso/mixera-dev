// useMobileDetection.js - Hook para detección móvil optimizada
import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkMobileFeatures = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detección de móvil por ancho de pantalla
      const mobileByWidth = width < 768;
      
      // Detección de capacidades táctiles
      const touchCapable = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 || 
                          navigator.msMaxTouchPoints > 0;
      
      // Detección por User Agent (backup)
      const mobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Orientación
      const currentOrientation = width > height ? 'landscape' : 'portrait';
      
      // Categoría de pantalla
      let size = 'desktop';
      if (width < 480) size = 'mobile';
      else if (width < 768) size = 'tablet';
      else if (width < 1024) size = 'tablet-large';
      
      setIsMobile(mobileByWidth || (touchCapable && mobileUserAgent));
      setIsTouch(touchCapable);
      setOrientation(currentOrientation);
      setScreenSize(size);
      
      console.log('Mobile Detection:', {
        isMobile: mobileByWidth || (touchCapable && mobileUserAgent),
        isTouch: touchCapable,
        width,
        height,
        orientation: currentOrientation,
        screenSize: size
      });
    };

    // Verificación inicial
    checkMobileFeatures();
    
    // Listener para cambios de tamaño/orientación
    const handleResize = () => {
      // Debounce para evitar múltiples llamadas
      clearTimeout(window.mobileDetectionTimeout);
      window.mobileDetectionTimeout = setTimeout(checkMobileFeatures, 150);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(window.mobileDetectionTimeout);
    };
  }, []);

  // Función para verificar si es móvil en landscape (problemas específicos)
  const isMobileLandscape = isMobile && orientation === 'landscape';
  
  // Función para verificar si necesita UI compacta
  const needsCompactUI = screenSize === 'mobile' || (isMobile && orientation === 'landscape');
  
  // Función para verificar si debe usar gestos nativos
  const shouldUseNativeGestures = isMobile && isTouch;

  return {
    isMobile,
    isTouch,
    orientation,
    screenSize,
    isMobileLandscape,
    needsCompactUI,
    shouldUseNativeGestures,
    
    // Utilidades
    isSmallScreen: screenSize === 'mobile',
    isTablet: screenSize === 'tablet' || screenSize === 'tablet-large',
    isDesktop: screenSize === 'desktop',
    
    // Info de debugging
    debugInfo: {
      userAgent: navigator.userAgent,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      touchPoints: navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0
    }
  };
};
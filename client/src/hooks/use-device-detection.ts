import { useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTouch: boolean;
  width: number;
  height: number;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    isMobile: false,
    isTouch: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    // Detecção inicial
    handleResize();

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', handleResize);
    
    // Verificar se dispositivo suporta toque
    if (typeof window !== 'undefined') {
      const isTouch = 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 || 
        // @ts-ignore - Microsoft-specific
        navigator.msMaxTouchPoints > 0;
      
      setDeviceInfo(prev => ({
        ...prev,
        isTouch
      }));
    }
    
    // Limpar listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function handleResize() {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Device detection logic
    let type: DeviceType = 'desktop';
    let isMobile = false;
    
    // Detectar se é mobile/tablet por tamanho
    if (width < 768) {
      type = 'mobile';
      isMobile = true;
    } else if (width < 1024) {
      type = 'tablet';
      isMobile = true;
    }
    
    // Detectar se é mobile por User Agent
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    if (typeof navigator !== 'undefined' && mobileRegex.test(navigator.userAgent)) {
      isMobile = true;
      // Diferenciar entre telefone e tablet por tamanho
      type = width < 768 ? 'mobile' : 'tablet';
    }
    
    setDeviceInfo({
      type,
      isMobile,
      isTouch: deviceInfo.isTouch,
      width,
      height
    });
  }

  // Função de debug no console
  useEffect(() => {
    console.log('DEVICE INFO:', {
      type: deviceInfo.type,
      isMobile: deviceInfo.isMobile,
      isTouch: deviceInfo.isTouch,
      width: deviceInfo.width,
      height: deviceInfo.height,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
  }, [deviceInfo.type, deviceInfo.width, deviceInfo.height]);

  return deviceInfo;
}
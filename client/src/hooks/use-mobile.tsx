import { useState, useEffect } from 'react';

export function useIsMobile() {
  // Função mais avançada para detecção de dispositivos móveis
  const detectMobile = () => {
    // Verificações modernas aprimoradas para dispositivos móveis
    
    // 1. Verifica tamanho da tela (mais comum)
    const screenCheck = window.innerWidth < 768;
    
    // 2. Verifica User Agent (alternativa quando o tamanho da tela não é confiável)
    const userAgentCheck = 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 3. Verificação específica de recursos touch
    const touchCheck = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      (navigator as any).msMaxTouchPoints > 0;
    
    // 4. Verificação de orientação (mais provável em dispositivos móveis)
    const orientationCheck = 
      typeof window.orientation !== 'undefined' || 
      navigator.userAgent.indexOf('IEMobile') !== -1;
    
    // Para debug - mostra detalhes de todas as verificações no console
    console.log("DETECÇÃO MÓVEL:", {
      screenCheck,
      userAgentCheck, 
      touchCheck, 
      orientationCheck,
      width: window.innerWidth,
      height: window.innerHeight,
      userAgent: navigator.userAgent
    });
    
    // Forçar Mobile para telas muito estreitas
    if (window.innerWidth < 500) {
      return true;
    }
    
    // Usar uma combinação de verificações para mais precisão
    // Esta abordagem híbrida funciona melhor para a maioria dos casos
    return (screenCheck && (touchCheck || userAgentCheck || orientationCheck));
  };
  
  // Definir valor padrão usando a função de detecção avançada
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? detectMobile() : false
  );

  useEffect(() => {
    // Verificar na montagem usando nossa função melhorada
    const checkDevice = () => {
      const mobileDetected = detectMobile();
      setIsMobile(mobileDetected);
      
      // Definir uma classe no document.body para estilos específicos por dispositivo
      if (mobileDetected) {
        document.body.classList.add('mobile-device');
      } else {
        document.body.classList.remove('mobile-device');
      }
      
      console.log("DECISÃO FINAL - Dispositivo detectado como:", mobileDetected ? "MOBILE" : "DESKTOP");
    };

    // Realizar verificação inicial
    checkDevice();

    // Adicionar evento de resize com debounce para melhor performance
    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkDevice, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', checkDevice);

    // Limpar eventos ao desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return isMobile;
}
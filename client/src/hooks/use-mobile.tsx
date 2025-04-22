import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint no Tailwind é 1024px
    };

    // Verificar na montagem
    checkSize();

    // Adicionar evento de resize
    window.addEventListener('resize', checkSize);

    // Limpar o evento ao desmontar
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return isMobile;
}
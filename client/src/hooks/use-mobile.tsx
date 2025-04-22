import { useState, useEffect } from 'react';

export function useIsMobile() {
  // Definir valor padrão baseado na largura da tela se disponível
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    // Função para verificar se é mobile (menor que 768px - breakpoint md)
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar na montagem
    checkSize();

    // Log para debug
    console.log("Detectado como:", isMobile ? "Mobile" : "Desktop", "- Largura:", window.innerWidth);

    // Adicionar evento de resize
    window.addEventListener('resize', checkSize);

    // Limpar o evento ao desmontar
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return isMobile;
}
/**
 * Este script contém soluções radicais para problemas de rolagem em dispositivos móveis
 * Ele será injetado diretamente no DOM e executado automaticamente
 */

export function setupMobileScrollFix() {
  // Verificar se é um dispositivo móvel
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                  (window.innerWidth <= 768);
  
  if (!isMobile) return; // Não fazer nada em dispositivos não-móveis
  
  // Aplicar correções iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Aplicar classe para habilitar correções CSS
  document.body.classList.add('mobile-scroll-fixed');
  
  // Injetar CSS crítico diretamente se necessário
  if (!document.getElementById('mobile-fix-css')) {
    const style = document.createElement('style');
    style.id = 'mobile-fix-css';
    style.textContent = `
      body.mobile-scroll-fixed {
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      
      .mobile-scroll-container {
        -webkit-overflow-scrolling: touch !important;
        overflow-y: auto !important;
        touch-action: pan-y !important;
        height: calc(100vh - 230px) !important;
        max-height: calc(100vh - 230px) !important;
        position: relative !important;
        overscroll-behavior: contain !important;
        padding-bottom: 20px !important;
      }
      
      ${isIOS ? `
        @supports (-webkit-touch-callout: none) {
          .mobile-scroll-container {
            height: calc(100vh - 210px) !important;
            max-height: calc(100vh - 210px) !important;
          }
        }
      ` : ''}
    `;
    document.head.appendChild(style);
  }
  
  // Prevenir comportamentos de rolagem padrão problemáticos
  function preventDefaultScrolling(e) {
    if (!e.target.closest('.mobile-scroll-container')) {
      e.preventDefault();
    }
  }
  
  document.addEventListener('touchmove', preventDefaultScrolling, { passive: false });
  
  // Configurar comportamento dos containers de rolagem
  function setupScrollContainers() {
    const containers = document.querySelectorAll('.mobile-scroll-container');
    containers.forEach(container => {
      container.style.webkitOverflowScrolling = 'touch';
      container.style.overscrollBehavior = 'contain';
      
      // Garantir propagação correta de eventos
      container.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
      container.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
      
      // Redefinir posição de rolagem para zero se necessário (corrige bug em iOS)
      container.scrollTop = 0;
    });
  }
  
  // Executar configuração e monitorar por mudanças
  const observer = new MutationObserver(setupScrollContainers);
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Configuração inicial
  setupScrollContainers();
  
  // Forçar atualização quando orientação do dispositivo mudar
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      setupScrollContainers();
      window.dispatchEvent(new Event('resize'));
    }, 100);
  });
  
  // Retornar função de limpeza para React useEffect
  return () => {
    document.body.classList.remove('mobile-scroll-fixed');
    document.removeEventListener('touchmove', preventDefaultScrolling);
    observer.disconnect();
    
    if (document.getElementById('mobile-fix-css')) {
      document.getElementById('mobile-fix-css').remove();
    }
  };
}
declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const getGTMId = (): string => {
  // ⚠️ FORÇANDO PROD MESMO EM LOCALHOST PARA DEBUG
  return 'GTM-PHS8NHMD'; // Sempre prod
};

export const isProduction = (): boolean => {
  return window.location.hostname === 'qualcarreira.com' || 
         window.location.hostname === 'www.qualcarreira.com';
};

export const initializeGTM = () => {
  // Verificar se já foi inicializado
  if (typeof window === 'undefined' || document.getElementById('gtm-script')) {
    return;
  }

  try {
    const gtmId = getGTMId();
    
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Inject GTM script
    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    
    // Aguardar o DOM estar pronto
    if (document.head) {
      document.head.insertBefore(script, document.head.firstChild);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.head.insertBefore(script, document.head.firstChild);
      });
    }
    
    // Inject noscript
    const noscript = document.createElement('noscript');
    noscript.id = 'gtm-noscript';
    noscript.innerHTML = `
      <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>
    `;
    
    // Aguardar o body estar pronto
    if (document.body) {
      document.body.insertBefore(noscript, document.body.firstChild);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.insertBefore(noscript, document.body.firstChild);
      });
    }
    
    console.log(`[GTM] Initialized with ID: ${gtmId}`);
  } catch (error) {
    console.error('[GTM] Error initializing:', error);
  }
};

export const pushToDataLayer = (data: any) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
    console.log('[GTM] Event pushed:', data);
  }
};

// ==================== GTM2 (Second Container) ====================

export const getGTM2Id = (): string => {
  return 'GTM-KL2DHVZS';
};

export const initializeGTM2 = () => {
  // Guard: verificar ambiente e se já foi inicializado
  if (typeof window === 'undefined' || document.getElementById('gtm2-js')) {
    return;
  }

  try {
    const gtmId = getGTM2Id();

    // Initialize dataLayer compartilhado (ambos os GTMs usam o mesmo)
    window.dataLayer = window.dataLayer || [];
    
    // Push do evento gtm.js ANTES de carregar o script (padrão GTM)
    window.dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js'
    });

    // Criar script usando src (mais robusto que innerHTML para CSP)
    const script = document.createElement('script');
    script.id = 'gtm2-js'; // ID único e descritivo
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}&l=dataLayer`;
    
    // Inserir no head
    if (document.head) {
      document.head.appendChild(script);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.head.appendChild(script);
      });
    }

    console.log(`[GTM2] Initialized with ID: ${gtmId}`);
  } catch (error) {
    console.error('[GTM2] Error initializing:', error);
  }
};

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const getGTMId = (): string => {
  const isProd = 
    window.location.hostname === 'qualcarreira.com' || 
    window.location.hostname === 'www.qualcarreira.com';
  return isProd ? 'GTM-PHS8NHMD' : 'GTM-TJG9LDR2';
};

export const isProduction = (): boolean => {
  return window.location.hostname === 'qualcarreira.com' || 
         window.location.hostname === 'www.qualcarreira.com';
};

export const initializeGTM = () => {
  const gtmId = getGTMId();
  
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Inject GTM script
  const script = document.createElement('script');
  script.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `;
  document.head.insertBefore(script, document.head.firstChild);
  
  // Inject noscript
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `
    <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe>
  `;
  document.body.insertBefore(noscript, document.body.firstChild);
  
  console.log(`[GTM] Initialized with ID: ${gtmId}`);
};

export const pushToDataLayer = (data: any) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
    console.log('[GTM] Event pushed:', data);
  }
};

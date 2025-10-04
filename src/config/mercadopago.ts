// Configurações do Mercado Pago por ambiente

export const mercadoPagoConfig = {
  dev: {
    publicKey: 'TEST-c01b60bb-9b82-4427-965f-32333af1dd20',
    price: 12.90,
  },
  prod: {
    publicKey: '', // Será configurado quando o site estiver em produção
    price: 12.90,
  }
};

export const getMercadoPagoConfig = () => {
  const isProd = window.location.hostname === 'carrerium.com' || 
                 window.location.hostname === 'www.carrerium.com';
  return isProd ? mercadoPagoConfig.prod : mercadoPagoConfig.dev;
};

// URLs de retorno
export const getPaymentUrls = () => {
  const baseUrl = window.location.origin;
  return {
    success: `${baseUrl}/pagamento/sucesso`,
    failure: `${baseUrl}/pagamento/falha`,
    pending: `${baseUrl}/pagamento/pendente`,
  };
};

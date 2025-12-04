// Configurações do Mercado Pago por ambiente

export const mercadoPagoConfig = {
  dev: {
    publicKey: 'TEST-c01b60bb-9b82-4427-965f-32333af1dd20',
    price: 12.90,
  },
  prod: {
    publicKey: 'APP_USR-40aea4f7-a179-402a-a1b8-f3b4bfed380e',
    price: 12.90,
  }
};

export const getMercadoPagoConfig = () => {
  // ⚠️ FORÇANDO PROD MESMO EM LOCALHOST PARA DEBUG
  return mercadoPagoConfig.prod; // Sempre prod
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

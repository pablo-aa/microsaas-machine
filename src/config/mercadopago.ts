// Configurações do Mercado Pago por ambiente

export const mercadoPagoConfig = {
  dev: {
    publicKey: '', // Você vai adicionar a chave pública de teste
    // Preço em modo sandbox
    price: 12.90,
  },
  prod: {
    publicKey: '', // Você vai adicionar a chave pública de produção
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

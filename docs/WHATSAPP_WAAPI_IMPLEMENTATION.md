# Guia de Uso do WAAPI para Envio de Mensagens WhatsApp

## Visão Geral

Este documento descreve como usar o serviço **waapi.app** para enviar mensagens no WhatsApp. O waapi é uma API que permite enviar mensagens através de uma instância do WhatsApp conectada.

## Configuração Necessária

### Variáveis de Ambiente

1. **`WAAPI_TOKEN`** (obrigatório)
   - Token de autenticação do waapi.app
   - Obtido no painel do waapi após criar uma instância
   - Usado no header `Authorization: Bearer {WAAPI_TOKEN}`

2. **`WAAPI_INSTANCE_ID`** (obrigatório)
   - ID da instância do WhatsApp no waapi
   - Exemplo: `60123`
   - Cada instância está associada a um número de WhatsApp específico

3. **`WAAPI_CHAT_ID`** (opcional)
   - ID do chat/grupo do WhatsApp onde a mensagem será enviada
   - Formato para grupos: `{número}@g.us`
   - Formato para contatos: `{número}@c.us`
   - Pode ser definido por variável de ambiente ou passado dinamicamente

## Endpoint da API WAAPI

```
POST https://waapi.app/api/v1/instances/{INSTANCE_ID}/client/action/send-message
```

### Exemplo com Instância Específica

```
POST https://waapi.app/api/v1/instances/60123/client/action/send-message
```

## Estrutura da Requisição

### Headers

```json
{
  "accept": "application/json",
  "authorization": "Bearer {WAAPI_TOKEN}",
  "content-type": "application/json"
}
```

### Body

```json
{
  "chatId": "{WAAPI_CHAT_ID}",
  "message": "{mensagem formatada}"
}
```

### Parâmetros

- **`chatId`** (string, obrigatório): ID do chat/grupo onde enviar a mensagem
- **`message`** (string, obrigatório): Texto da mensagem a ser enviada

## Exemplo de Implementação

### Código Completo (TypeScript/Deno)

```typescript
async function sendWhatsAppMessage(chatId: string, message: string) {
  // 1. Obter token do ambiente
  const waapiToken = Deno.env.get('WAAPI_TOKEN');
  if (!waapiToken) {
    throw new Error('WAAPI_TOKEN not configured');
  }

  // 2. Obter ID da instância
  const instanceId = Deno.env.get('WAAPI_INSTANCE_ID');
  if (!instanceId) {
    throw new Error('WAAPI_INSTANCE_ID not configured');
  }

  // 3. Enviar mensagem via WAAPI
  const response = await fetch(
    `https://waapi.app/api/v1/instances/${instanceId}/client/action/send-message`,
    {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${waapiToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        message
      })
    }
  );

  // 4. Verificar resposta
  const responseText = await response.text();
  
  if (!response.ok) {
    console.error('WAAPI error:', responseText);
    throw new Error(`Failed to send WhatsApp message: ${response.status} - ${responseText}`);
  }

  console.log('WhatsApp message sent successfully');
  
  // Retornar resposta parseada se for JSON, senão retornar texto
  try {
    return JSON.parse(responseText);
  } catch {
    return { success: true, response: responseText };
  }
}

// Exemplo de uso
const chatId = Deno.env.get('WAAPI_CHAT_ID') || '120363421610156383@g.us';
const message = '*Olá!*\n\nEsta é uma mensagem de teste.';

await sendWhatsAppMessage(chatId, message);
```

### Exemplo Simplificado (JavaScript/Node.js)

```javascript
async function sendWhatsAppMessage(chatId, message) {
  const waapiToken = process.env.WAAPI_TOKEN;
  const instanceId = process.env.WAAPI_INSTANCE_ID;

  if (!waapiToken || !instanceId) {
    throw new Error('WAAPI_TOKEN and WAAPI_INSTANCE_ID must be configured');
  }

  const response = await fetch(
    `https://waapi.app/api/v1/instances/${instanceId}/client/action/send-message`,
    {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${waapiToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        message
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WAAPI error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}
```

## Formatação de Mensagens

### Formatação de Texto (Markdown)

O WhatsApp suporta formatação básica usando Markdown:

- **Negrito**: `*texto*` → *texto*
- **Itálico**: `_texto_` → _texto_
- **Tachado**: `~texto~` → ~texto~
- **Monospace**: `` `texto` `` → `texto`

### Exemplo de Mensagem Formatada

```
*Notificação Importante* 🚨

Olá! Esta é uma mensagem formatada.

*Detalhes:*
- Item 1
- Item 2
- Item 3

_Enviado automaticamente_
```

### Emojis

Você pode usar emojis diretamente na mensagem:
- ✅ ❌ ⚠️ 🎉 💰 📧 📱 🔔

## Tratamento de Erros

### Verificações Importantes

1. **Token ausente**: Sempre verificar se `WAAPI_TOKEN` está configurado
2. **Instância ausente**: Verificar se `WAAPI_INSTANCE_ID` está configurado
3. **Resposta não OK**: Verificar `response.ok` antes de considerar sucesso
4. **Logs**: Sempre logar status e resposta para debugging

### Exemplo de Tratamento Robusto

```typescript
async function sendWhatsAppMessage(chatId: string, message: string) {
  try {
    const waapiToken = Deno.env.get('WAAPI_TOKEN');
    if (!waapiToken) {
      throw new Error('WAAPI_TOKEN not configured');
    }

    const instanceId = Deno.env.get('WAAPI_INSTANCE_ID');
    if (!instanceId) {
      throw new Error('WAAPI_INSTANCE_ID not configured');
    }

    const response = await fetch(
      `https://waapi.app/api/v1/instances/${instanceId}/client/action/send-message`,
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${waapiToken}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          chatId,
          message
        })
      }
    );

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('[WAAPI] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      throw new Error(`WAAPI error: ${response.status} - ${responseText}`);
    }

    console.log('[WAAPI] Message sent successfully');
    
    try {
      return JSON.parse(responseText);
    } catch {
      return { success: true, response: responseText };
    }
    
  } catch (error) {
    console.error('[WAAPI] Failed to send message:', error);
    throw error;
  }
}
```

## Identificadores de Chat (chatId)

### Formato

- **Grupos**: `{número}@g.us`
  - Exemplo: `120363421610156383@g.us`
  
- **Contatos individuais**: `{número}@c.us`
  - Exemplo: `5511999999999@c.us`

### Como Obter o chatId

1. **Para grupos**: O chatId geralmente é fornecido pelo waapi quando você lista os grupos
2. **Para contatos**: Use o número do WhatsApp no formato internacional (sem +) seguido de `@c.us`
3. **Via painel waapi**: Consulte a documentação do waapi para obter os IDs dos chats disponíveis

## Boas Práticas

1. **Validação de entrada**: Sempre validar `chatId` e `message` antes de enviar
2. **Tratamento de erros**: Implementar retry com backoff exponencial se necessário
3. **Rate limiting**: O waapi pode ter limites de taxa, considerar implementar throttling
4. **Logs**: Registrar todas as tentativas de envio (sucesso e falha) para debugging
5. **Variáveis de ambiente**: Nunca hardcodar tokens ou IDs de instância no código

### Exemplo com Retry

```typescript
async function sendWhatsAppMessageWithRetry(
  chatId: string, 
  message: string, 
  maxRetries = 3
) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendWhatsAppMessage(chatId, message);
    } catch (error) {
      lastError = error;
      console.warn(`[WAAPI] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Backoff exponencial: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
```

## Informações Técnicas

### Instância e Número

- **Instância ID**: `60123` (usada neste projeto)
- **Número do WhatsApp**: Associado à instância 60123 (verificar no painel do waapi)
- **Token**: Único por instância, obtido no painel do waapi

### Rate Limiting

O waapi pode ter limites de taxa. Consulte a documentação oficial ou o painel para verificar:
- Limite de mensagens por minuto/hora
- Limite de mensagens por dia
- Políticas de throttling

### CORS

Se estiver fazendo chamadas do navegador, verifique se o waapi suporta CORS ou use um backend/proxy.

## Referências

- **Serviço**: waapi.app
- **Documentação oficial**: https://waapi.app/docs (verificar para atualizações)
- **Painel**: Acesse o painel do waapi para gerenciar instâncias e obter tokens

## Exemplo Completo de Uso

```typescript
// Configuração
const WAAPI_TOKEN = Deno.env.get('WAAPI_TOKEN');
const WAAPI_INSTANCE_ID = Deno.env.get('WAAPI_INSTANCE_ID') || '60123';
const WAAPI_CHAT_ID = Deno.env.get('WAAPI_CHAT_ID') || '120363421610156383@g.us';

// Função de envio
async function sendMessage(text: string) {
  if (!WAAPI_TOKEN) {
    throw new Error('WAAPI_TOKEN not configured');
  }

  const response = await fetch(
    `https://waapi.app/api/v1/instances/${WAAPI_INSTANCE_ID}/client/action/send-message`,
    {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${WAAPI_TOKEN}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        chatId: WAAPI_CHAT_ID,
        message: text
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WAAPI error: ${response.status} - ${error}`);
  }

  return await response.json();
}

// Uso
await sendMessage('*Olá!* Esta é uma mensagem de teste 🚀');
```

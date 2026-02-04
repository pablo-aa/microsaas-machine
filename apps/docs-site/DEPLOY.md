# Deploy e Proteção - Documentação

Guia completo para fazer deploy da documentação no Cloudflare Pages com proteção via Cloudflare Access.

## 📋 Pré-requisitos

- Conta no Cloudflare
- Domínio `octoper.com` configurado no Cloudflare (ou configurar agora)
- Repositório GitHub conectado

## 🚀 Passo 1: Configurar Cloudflare Pages

### 1.1 Criar Projeto no Cloudflare Pages

1. Acesse https://dash.cloudflare.com
2. No menu lateral, vá em **Workers & Pages** > **Pages**
3. Clique em **Create a project**
4. Selecione **Connect to Git**
5. Escolha **GitHub** e autorize a conexão (se necessário)
6. Selecione o repositório `microsaas-machine` (ou o nome do seu repo)
7. Clique em **Begin setup**

### 1.2 Configurar Build Settings

Preencha os seguintes campos:

- **Project name**: `microsaas-machine-docs` (ou outro nome de sua preferência)
- **Production branch**: `main` (ou `master`, conforme sua branch principal)
- **Framework preset**: Selecione **Docusaurus** (ou "None" se não aparecer)
- **Build command**: 
  ```
  cd apps/docs-site && npm install && npm run build
  ```
- **Build output directory**: 
  ```
  apps/docs-site/build
  ```
- **Nota**: Os arquivos markdown estão em `apps/docs-site/docs/` (dentro do projeto Docusaurus)
- **Root directory**: Deixe vazio (ou `/` se necessário)
- **Environment variables**: Não é necessário para Docusaurus básico

### 1.3 Salvar e Aguardar Primeiro Deploy

1. Clique em **Save and Deploy**
2. Aguarde o primeiro deploy ser concluído (pode levar alguns minutos)
3. Anote o domínio temporário do Pages (ex: `microsaas-machine-docs.pages.dev`)

## 🌐 Passo 2: Configurar Domínio Customizado

### 2.1 Adicionar Domínio docs.octoper.com

1. No projeto do Cloudflare Pages, vá em **Custom domains**
2. Clique em **Set up a custom domain**
3. Digite: `docs.octoper.com`
4. Clique em **Continue**
5. O Cloudflare irá verificar o domínio e criar automaticamente o registro DNS necessário

**IMPORTANTE**: O Cloudflare Pages criará automaticamente um registro CNAME apontando `docs.octoper.com` para o endereço do Pages. Você não precisa criar manualmente.

### 2.2 Verificar DNS

1. No Cloudflare, vá em **DNS** > **Records** do domínio `octoper.com`
2. Verifique se existe um registro CNAME:
   - **Name**: `docs`
   - **Target**: `microsaas-machine-docs.pages.dev` (ou similar)
   - **Proxy status**: Proxied (ícone laranja)
3. Se não existir, o Cloudflare Pages deveria ter criado automaticamente. Se não criou:
   - Clique em **Add record**
   - Tipo: **CNAME**
   - Name: `docs`
   - Target: O endereço do seu Cloudflare Pages (encontre em Pages > Custom domains)
   - Proxy: **Proxied** (deve estar laranja)
   - TTL: Auto
   - Salve

### 2.3 Remover CNAME Antigo (se existir)

Se você tinha um CNAME no Spaceship ou outro provedor DNS apontando para GitHub Pages:

1. Acesse o painel do Spaceship (ou seu provedor DNS atual)
2. Vá nas configurações de DNS do domínio `octoper.com`
3. Localize o registro CNAME para `docs.octoper.com` que aponta para `pablo-aa.github.io` (ou similar)
4. **Remova ou delete** este registro CNAME
5. Salve as alterações

## 🔐 Passo 3: Configurar Cloudflare Access (Proteção)

### 3.1 Ativar Cloudflare Zero Trust

1. Acesse https://one.dash.cloudflare.com
2. Se você ainda não tem Zero Trust ativado:
   - Clique em **Sign up** (é gratuito para até 50 usuários)
   - Escolha um nome para sua organização
   - Complete o setup inicial

### 3.2 Criar Aplicação no Cloudflare Access

1. No menu lateral, vá em **Access** > **Applications**
2. Clique em **Add an application**
3. Selecione **SaaS** (para Cloudflare Pages)
4. Preencha os campos:
   - **Application name**: `Documentação MicroSaaS`
   - **Application domain**: `docs.octoper.com`
   - **Session duration**: `24 hours` (ou conforme preferência)
   - **Application logo** (opcional): Adicione um logo se desejar

### 3.3 Configurar Policy de Acesso

Na seção **Policies**, clique em **Add a policy**:

- **Policy name**: `Acesso Documentação`
- **Action**: `Allow`
- **Include**:
  - Escolha uma das opções:
    - **Emails**: Adicione emails específicos (ex: `seu-email@exemplo.com`)
    - **Emails ending in**: Para permitir todo um domínio (ex: `@octoper.com`)
    - **Groups**: Se você criou grupos (recomendado para múltiplos usuários)

**Exemplo de configuração por email específico:**
```
Policy name: Acesso Documentação
Action: Allow
Include:
 - Emails: usuario1@exemplo.com, usuario2@exemplo.com
```

**Exemplo de configuração por domínio:**
```
Policy name: Acesso Documentação
Action: Allow
Include:
 - Emails ending in: @octoper.com
```

### 3.4 Configurar Métodos de Autenticação

Na seção **Authentication**:

1. Em **Identity providers**, você verá opções:
   - **Email one-time PIN**: Login via email (envia código por email)
   - **GitHub** (opcional): Login via GitHub OAuth
   - **Google** (opcional): Login via Google
   - **Azure AD** (opcional): Para empresas

2. Para começar, recomenda-se usar **Email one-time PIN**:
   - Clique em **Add** ao lado de "Email one-time PIN"
   - Configure o nome do provider (ex: "Email")
   - Salve

3. Se quiser adicionar GitHub ou Google:
   - Clique em **Add** ao lado da opção desejada
   - Siga o processo de OAuth (você precisará criar apps no GitHub/Google)

### 3.5 Salvar Aplicação

1. Clique em **Add application**
2. Aguarde alguns minutos para a configuração propagar

### 3.6 Vincular Access ao Cloudflare Pages (Automático)

O Cloudflare Access detecta automaticamente aplicações no mesmo domínio. Se não funcionar automaticamente:

1. Volte para o Cloudflare Pages (https://dash.cloudflare.com > Workers & Pages > Pages)
2. Selecione seu projeto `microsaas-machine-docs`
3. Vá em **Custom domains**
4. Clique no domínio `docs.octoper.com`
5. Procure por **Access** ou **Zero Trust** nas opções
6. Ative o Cloudflare Access para este domínio
7. Selecione a aplicação criada: `Documentação MicroSaaS`

## ✅ Passo 4: Testar

### 4.1 Testar Deploy

1. Aguarde alguns minutos para propagação
2. Acesse o domínio temporário do Pages (ex: `microsaas-machine-docs.pages.dev`)
3. Verifique se a documentação está funcionando

### 4.2 Testar Domínio Customizado

1. Aguarde alguns minutos para propagação DNS (pode levar até 15 minutos)
2. Acesse `https://docs.octoper.com`
3. Verifique se a documentação está funcionando

### 4.3 Testar Autenticação

1. Acesse `https://docs.octoper.com` em uma janela anônima/privada
2. Você deve ser redirecionado para a tela de login do Cloudflare
3. Faça login com um dos métodos configurados
4. Após autenticar, você deve ver a documentação

## 🔧 Troubleshooting

### Documentação não aparece após login
- Verifique se o DNS está propagado: `dig docs.octoper.com`
- Verifique se o Cloudflare Pages está com deploy bem-sucedido
- Verifique se o domínio customizado está configurado corretamente

### Erro de acesso negado
- Verifique se o email está na policy de acesso
- Verifique se a sessão não expirou
- Verifique se o domínio está configurado corretamente no Access

### Redirecionamento infinito
- Limpe cookies do navegador
- Verifique SSL/TLS no Cloudflare (deve estar "Full" ou "Full (strict)")
- Verifique se o Access está configurado corretamente

### Outros subdomínios pararam de funcionar
- Verifique se os registros DNS dos outros subdomínios ainda existem no Cloudflare
- Verifique se o modo proxy está correto para cada subdomínio
- Se necessário, restaure os registros DNS dos outros subdomínios

## 📝 Notas Importantes

- **Cloudflare Access**: Gratuito para até 50 usuários
- **Sessão**: Padrão de 24 horas (configurável)
- **Deploy Automático**: Cloudflare Pages faz deploy automático a cada push na branch `main`
- **Build**: O build é feito automaticamente pelo Cloudflare Pages

## 🔗 Recursos

- [Documentação do Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Documentação do Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Guia de configuração de domínios no Cloudflare](https://developers.cloudflare.com/dns/manage-dns-records/)

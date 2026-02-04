---
layout: default
title: Configuração Cloudflare Access
---

# Configuração Cloudflare Access

Este guia explica como configurar o Cloudflare Access para proteger a documentação hospedada no GitHub Pages.

## Pré-requisitos

- Conta no Cloudflare
- Domínio gerenciado pelo Cloudflare
- DNS configurado com CNAME apontando para `pablo-aa.github.io`
- GitHub Pages configurado e funcionando

## Passo a Passo

### 1. Acessar Cloudflare Zero Trust

1. Acesse: https://one.dash.cloudflare.com
2. Faça login com sua conta Cloudflare
3. Se ainda não tiver Zero Trust ativado, você precisará criar uma conta (gratuita para até 50 usuários)

### 2. Criar Aplicação

1. No menu lateral, vá em **Access** > **Applications**
2. Clique em **Add an application**
3. Selecione **Self-hosted**

### 3. Configurar Aplicação

Preencha os seguintes campos:

- **Application name**: `Documentação MicroSaaS`
- **Session duration**: `24 hours` (ou conforme sua preferência)
- **Application domain**: Seu subdomínio (ex: `docs.seudominio.com`)
- **Application logo** (opcional): Adicione um logo se desejar

### 4. Configurar Policy de Acesso

Na seção **Policies**, configure quem terá acesso:

#### Opção 1: Por Email Específico
- **Policy name**: `Acesso Documentação`
- **Action**: `Allow`
- **Include**:
  - **Emails**: Adicione os emails que devem ter acesso
  - Exemplo: `usuario1@exemplo.com`, `usuario2@exemplo.com`

#### Opção 2: Por Domínio de Email
- **Policy name**: `Acesso Documentação`
- **Action**: `Allow`
- **Include**:
  - **Emails ending in**: `@seudominio.com`
  - Isso permite acesso a todos com email do seu domínio

#### Opção 3: Por Grupo (Recomendado para múltiplos usuários)
1. Primeiro, crie um grupo em **Access** > **Groups**
2. Adicione emails ao grupo
3. Na policy, selecione o grupo criado

### 5. Configurar Métodos de Autenticação

Na seção **Authentication**:

- **Identity providers**: Selecione os métodos permitidos
  - **Email**: Login via email (One-time PIN)
  - **GitHub** (opcional): Login via GitHub OAuth
  - **Google** (opcional): Login via Google
  - **Azure AD** (opcional): Para empresas

Para começar, recomenda-se usar apenas **Email**.

### 6. Salvar e Testar

1. Clique em **Add application**
2. Aguarde alguns minutos para a configuração propagar
3. Acesse seu subdomínio (ex: `https://docs.seudominio.com`)
4. Você deve ser redirecionado para a tela de login do Cloudflare
5. Após fazer login, você terá acesso à documentação

## Gerenciamento de Usuários

### Adicionar Novo Usuário

1. Vá em **Access** > **Users**
2. Clique em **Invite users**
3. Digite o email do usuário
4. Selecione as aplicações que o usuário deve acessar
5. Envie o convite

### Remover Acesso

1. Vá em **Access** > **Users**
2. Encontre o usuário
3. Clique nos três pontos e selecione **Remove**
4. Ou edite a policy e remova o email da lista

## Troubleshooting

### Documentação não aparece após login

- Verifique se o DNS está apontando corretamente para `pablo-aa.github.io`
- Aguarde alguns minutos para propagação
- Verifique se o GitHub Pages está funcionando acessando diretamente `https://pablo-aa.github.io/microsaas-machine/`

### Erro de acesso negado

- Verifique se o email está na policy de acesso
- Verifique se a sessão não expirou (faça logout e login novamente)
- Verifique se o domínio está configurado corretamente no Cloudflare

### Redirecionamento infinito

- Limpe os cookies do navegador
- Verifique se o SSL está configurado corretamente no Cloudflare
- Certifique-se de que o domínio está no modo "Full" ou "Full (strict)" no Cloudflare

## Recursos Adicionais

- [Documentação oficial do Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Guia de configuração de aplicações](https://developers.cloudflare.com/cloudflare-one/applications/)

## Notas Importantes

- O Cloudflare Access é gratuito para até 50 usuários
- Após 50 usuários, há um plano pago
- A sessão padrão é de 24 horas, mas pode ser configurada
- É possível configurar múltiplas policies para diferentes níveis de acesso

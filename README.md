# MicroSaaS Machine

Monorepo contendo os projetos do MicroSaaS Machine.

## 📦 Aplicações

### QualCarreira
Plataforma de teste vocacional baseada em metodologias científicas (RIASEC, Gardner e GOPC).

- **Tecnologias**: Next.js 16, React 19, TypeScript, Supabase, Mercado Pago
- **Documentação**: [`apps/qual-carreira-seguir/README.md`](apps/qual-carreira-seguir/README.md)
- **Docs Internos**: [`apps/qual-carreira-seguir/docs/`](apps/qual-carreira-seguir/docs/)

### Dashboard
Dashboard web para visualização de métricas de performance (faturamento, custos, ROAS, funil de conversão).

- **Tecnologias**: React, Vite, TypeScript, Supabase Edge Functions, Google Ads API
- **Documentação**: [`apps/dashboard/README.md`](apps/dashboard/README.md)

## 📚 Documentação

A documentação completa está disponível em:

- **GitHub Pages**: [Acessar Documentação](https://pablo-aa.github.io/microsaas-machine/)
- **Protegida por Cloudflare Access** - Apenas usuários autorizados podem acessar

A documentação inclui:
- Informações sobre a infraestrutura (VPS)
- Links para documentação de cada aplicação
- Guias de setup e deploy

## 🏗️ Estrutura

```
microsaas-machine/
├── apps/
│   ├── qual-carreira-seguir/    # Teste vocacional
│   └── dashboard/                # Dashboard de métricas
├── docs/                         # Documentação (GitHub Pages)
│   ├── index.md
│   ├── vps.md
│   └── _config.yml
└── README.md                      # Este arquivo
```

## 🚀 Setup Rápido

Cada aplicação possui seu próprio README com instruções de setup. Consulte:

- [`apps/qual-carreira-seguir/README.md`](apps/qual-carreira-seguir/README.md)
- [`apps/dashboard/README.md`](apps/dashboard/README.md)

## 🔐 Acesso à Documentação

A documentação hospedada no GitHub Pages é protegida por **Cloudflare Access**. 

Para acessar, você precisa:
1. Ter um email autorizado na política do Cloudflare Access
2. Acessar o subdomínio configurado
3. Fazer login via Cloudflare Zero Trust

## 📝 Contribuindo

Este é um repositório privado. Para contribuir:

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Commit suas mudanças: `git commit -m 'feat: minha feature'`
3. Push para a branch: `git push origin feature/minha-feature`
4. Abra um Pull Request

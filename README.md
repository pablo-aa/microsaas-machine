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

- **Documentação**: [docs.octoper.com](https://docs.octoper.com)

A documentação inclui:
- Informações sobre a infraestrutura (VPS)
- Links para documentação de cada aplicação
- Guias de setup e deploy

**Nota**: O domínio octoper.com é gerenciado via Cloudflare, incluindo os subdomínios desta documentação (docs.octoper.com), Coolify e Grafana.

## 🏗️ Estrutura

```
microsaas-machine/
├── apps/
│   ├── qual-carreira-seguir/    # Teste vocacional
│   ├── dashboard/                # Dashboard de métricas
│   └── docs-site/                # Site Docusaurus (documentação)
├── docs/                         # Arquivos markdown da documentação
│   ├── index.md
│   └── vps.md
└── README.md                      # Este arquivo
```

## 🚀 Setup Rápido

Cada aplicação possui seu próprio README com instruções de setup. Consulte:

- [`apps/qual-carreira-seguir/README.md`](apps/qual-carreira-seguir/README.md)
- [`apps/dashboard/README.md`](apps/dashboard/README.md)


## 📝 Contribuindo

Este é um repositório privado. Para contribuir:

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Commit suas mudanças: `git commit -m 'feat: minha feature'`
3. Push para a branch: `git push origin feature/minha-feature`
4. Abra um Pull Request

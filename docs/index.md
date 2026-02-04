# Documentação MicroSaaS Machine

Bem-vindo à documentação do monorepo MicroSaaS Machine. Esta documentação centraliza informações sobre os projetos, infraestrutura e processos.

## Documentação

A documentação segue a mesma estrutura da navegação lateral do site.

### Sobre o projeto

- [**Sobre o Projeto**](/readme) – Visão geral do monorepo e aplicações

### Infraestrutura

- [**VPS**](/vps) – Serviços, domínios, rede, firewall e deploy

### QualCarreira

Plataforma de teste vocacional. Documentação temática:

- [Arquitetura](/qual-carreira-seguir/architecture)
- [Integrações](/qual-carreira-seguir/integrations)
- [Deploy](/qual-carreira-seguir/deploy)
- [Estrutura do questionário contextual](/qual-carreira-seguir/contextual-questionnaire-structure)
- [Guia de configuração de experimentos](/qual-carreira-seguir/experiment-setup-guide)
- [Status GTM](/qual-carreira-seguir/gtm-status)
- [Implementação WhatsApp WAAPI](/qual-carreira-seguir/whatsapp-waapi-implementation)
- [Carreiras e índices](/qual-carreira-seguir/carreiras-e-indices)

### Dashboard

- [Visão geral](/dashboard/readme)
- [Arquitetura](/dashboard/architecture)
- [Setup e deploy](/dashboard/setup-and-deploy)
- [Edge Functions](/dashboard/edge-functions)
- [Funcionalidades](/dashboard/features)
- [Troubleshooting](/dashboard/troubleshooting)

## Estrutura do monorepo

```
microsaas-machine/
├── apps/
│   ├── qual-carreira-seguir/    # Plataforma de teste vocacional
│   ├── dashboard/               # Dashboard de métricas
│   └── docs-site/               # Site Docusaurus (esta documentação)
├── docs/                        # Arquivos markdown da documentação
└── README.md                    # README principal
```

# Documentação da VPS

Documentação enxuta da infraestrutura do servidor. Esta página descreve a **estrutura** (serviços, portas, deploy, usuários). Dados que mudam com o tempo (IP, uptime, versões, containers em execução) ficam na saída do script de coleta.

### Dados atuais (voláteis)

Para obter IP, hostname, uptime, uso de CPU/RAM/disco, versões dos serviços e lista de containers, execute **no servidor** o script `scripts/collect-vps-info.sh`. A saída pode ser salva em `scripts/vps-info.txt` para referência local (não versionar se contiver dados sensíveis).

### Visão geral (estrutura)

- **Sistema**: Ubuntu 24.04 LTS (Noble Numbat)
- **Hostname**: `microsaas-machine`
- **Recursos típicos**: 4 cores, ~8 GB RAM, 150 GB disco; valores atuais na saída do script acima

## Serviços

### Coolify (gerenciamento de deploy)

Coolify é a plataforma principal para gerenciamento de aplicações e deploy.

- **Porta**: 8000 (acesso web)
- **Versão e status atuais**: ver saída de `scripts/collect-vps-info.sh`
- **Diretório**: `/data/coolify`
- **Componentes**:
  - `coolify` - Aplicação principal
  - `coolify-db` - PostgreSQL 15 (banco de dados)
  - `coolify-redis` - Redis 7 (cache/fila)
  - `coolify-proxy` - Traefik (proxy reverso)
  - `coolify-realtime` - Serviço de tempo real (portas 6001-6002)
  - `coolify-sentinel` - Serviço de monitoramento

### Traefik (proxy reverso)

- **Portas**:
  - `80` - HTTP
  - `443` - HTTPS
  - `8080` - Dashboard administrativo
- **Funcionalidades**:
  - Gerenciamento automático de certificados SSL (Let's Encrypt)
  - Roteamento de tráfego para containers Docker
  - Dashboard administrativo

### Monitoramento

#### Grafana
- **Imagem**: `grafana/grafana-oss:latest`
- **Porta interna**: 3000
- **Uso**: Visualização de métricas e dashboards

#### Prometheus
- **Imagem**: `prom/prometheus:latest`
- **Porta interna**: 9090
- **Uso**: Coleta de métricas

#### Node Exporter
- **Imagem**: `prom/node-exporter:latest`
- **Porta interna**: 9100
- **Uso**: Métricas do sistema operacional

#### cAdvisor
- **Imagem**: `gcr.io/cadvisor/cadvisor:latest`
- **Porta interna**: 8080
- **Uso**: Métricas de containers Docker

### Aplicações em produção

As aplicações rodam em containers Docker gerenciados pelo Coolify (identificados por hash). Para listar containers em execução, imagens e portas atuais, execute no servidor `scripts/collect-vps-info.sh`. Para associar cada container à aplicação, use o dashboard do Coolify.

## Domínios

### Domínios configurados

Os domínios são gerenciados via Coolify e Traefik. Para verificar os domínios configurados:

1. Acesse o dashboard do Coolify (porta 8000; IP do servidor na saída de `scripts/collect-vps-info.sh` ou na configuração do provedor).
2. Verifique as aplicações e seus domínios configurados.

### SSL/TLS

- **Gerenciamento**: Let's Encrypt via Traefik
- **Renovação**: Automática
- **Certificados**: Armazenados em `/traefik/acme.json` (dentro do container)

## Rede e firewall

### Portas abertas

- **22** - SSH (OpenSSH)
- **80** - HTTP (Traefik)
- **443** - HTTPS (Traefik)
- **8000** - Coolify Dashboard
- **8080** - Traefik Dashboard
- **6001-6002** - Coolify Realtime

### Firewall (UFW)

- **Status**: Ativo
- **Regras**:
  - OpenSSH: Permitido de qualquer lugar
  - 80/tcp: Permitido de qualquer lugar
  - 443/tcp: Permitido de qualquer lugar
  - Todas as outras portas: Bloqueadas por padrão

### Interfaces de rede

- **eth0**: IP público (ver saída de `scripts/collect-vps-info.sh` — seção "INFORMAÇÕES DE REDE")
- **docker0**: Rede Docker (ex.: `10.0.0.1/24`)
- **Bridge Docker**: interfaces adicionais para redes de containers (nomes variam)

## Deploy

### Processo automático

- **Método**: Coolify (gerenciamento via interface web)
- **Integração**: GitHub (via webhooks ou manual)
- **Branch**: Configurado por aplicação no Coolify
- **Build**: Executado automaticamente pelo Coolify

### Acessos

- **SSH**: `ssh -i ~/.ssh/id_ed25519 deploy@<IP_DO_SERVIDOR>` (IP na saída de `scripts/collect-vps-info.sh` ou na configuração do provedor)
- **Coolify Dashboard**: `http://<IP_DO_SERVIDOR>:8000`
- **Traefik Dashboard**: `http://<IP_DO_SERVIDOR>:8080`
- **Grafana**: Acessível via Traefik (verificar domínio configurado no Coolify)

### Usuários do sistema

- **deploy** (UID 1000) - Usuário principal para deploy
  - Grupos: `deploy`, `sudo`, `users`, `docker`
  - Home: `/home/deploy`
- **root** (UID 0) - Administrador
- **www-data** (UID 33) - Usuário web padrão

## Variáveis de ambiente

### Aplicações

As seguintes variáveis são utilizadas (valores não documentados por segurança):

**qual-carreira-seguir:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROWTHBOOK_CLIENT_KEY`
- `NEXT_PUBLIC_GA4_API_SECRET`
- `[OUTRAS VARIÁVEIS]`

**dashboard:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `[OUTRAS VARIÁVEIS]`

## Notas

- Atualize esta documentação quando a estrutura da infraestrutura mudar (novos serviços, portas, usuários).
- Dados voláteis (IP, uptime, versões, containers): use `scripts/collect-vps-info.sh` no servidor; opcionalmente salve em `scripts/vps-info.txt`.
- Valores sensíveis (senhas, tokens) não devem ser documentados aqui.

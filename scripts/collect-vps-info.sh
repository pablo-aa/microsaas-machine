#!/bin/bash

# Script para coletar informações do VPS para documentação
# Execute no servidor: ssh -i ~/.ssh/id_ed25519 deploy@5.161.211.38
# Depois rode: bash collect-vps-info.sh

echo "=== INFORMAÇÕES DO SISTEMA ==="
echo ""
echo "Hostname:"
hostname
echo ""
echo "Sistema Operacional:"
uname -a
cat /etc/os-release | head -5
echo ""
echo "Uptime:"
uptime
echo ""

echo "=== RECURSOS DO SISTEMA ==="
echo ""
echo "Disco:"
df -h
echo ""
echo "Memória:"
free -h
echo ""
echo "CPU:"
lscpu | grep -E "Model name|CPU\(s\)|Thread|Core"
echo ""

echo "=== SERVIÇOS EM EXECUÇÃO ==="
echo ""
echo "Serviços systemd:"
sudo systemctl list-units --type=service --state=running | grep -E "(nginx|docker|postgres|redis|coolify|grafana|prometheus|node|pm2)" || echo "Nenhum serviço relevante encontrado"
echo ""

echo "=== DOCKER ==="
echo ""
if command -v docker &> /dev/null; then
    echo "Containers em execução:"
    docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
    echo ""
    echo "Imagens Docker:"
    docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' | head -10
else
    echo "Docker não está instalado ou não está no PATH"
fi
echo ""

echo "=== NGINX ==="
echo ""
if command -v nginx &> /dev/null; then
    echo "Status do Nginx:"
    sudo nginx -t 2>&1
    echo ""
    echo "Sites configurados:"
    sudo ls -la /etc/nginx/sites-enabled/ 2>/dev/null || sudo ls -la /etc/nginx/conf.d/ 2>/dev/null || echo "Nenhum site encontrado"
    echo ""
    echo "Configurações principais:"
    sudo cat /etc/nginx/nginx.conf | grep -E "user|worker_processes|listen" | head -5
else
    echo "Nginx não está instalado"
fi
echo ""

echo "=== PORTAS EM USO ==="
echo ""
echo "Portas TCP abertas:"
sudo ss -tlnp | grep LISTEN | head -20
echo ""

echo "=== DOMÍNIOS E DNS ==="
echo ""
echo "Hosts locais:"
cat /etc/hosts | grep -v "^#" | grep -v "^$"
echo ""

echo "=== COOLIFY (se instalado) ==="
echo ""
if [ -d "/data/coolify" ] || [ -d "/opt/coolify" ] || [ -d "$HOME/coolify" ]; then
    echo "Diretório Coolify encontrado"
    find /data /opt $HOME -maxdepth 2 -type d -name "coolify" 2>/dev/null
else
    echo "Coolify não encontrado nos locais padrão"
fi
echo ""

echo "=== GRAFANA (se instalado) ==="
echo ""
if command -v grafana-server &> /dev/null || docker ps | grep -q grafana; then
    echo "Grafana encontrado"
    docker ps | grep grafana || systemctl status grafana 2>/dev/null | head -5
else
    echo "Grafana não encontrado"
fi
echo ""

echo "=== USUÁRIOS E PERMISSÕES ==="
echo ""
echo "Usuário atual:"
whoami
id
echo ""
echo "Usuários do sistema:"
cat /etc/passwd | grep -E "(deploy|root|www-data|nginx)" | cut -d: -f1,3,4,6
echo ""

echo "=== DIRETÓRIOS IMPORTANTES ==="
echo ""
echo "Home do deploy:"
ls -la ~ | head -10
echo ""
echo "Diretórios comuns:"
for dir in /var/www /opt /data /home; do
    if [ -d "$dir" ]; then
        echo "$dir:"
        ls -la "$dir" 2>/dev/null | head -5
    fi
done
echo ""

echo "=== VARIÁVEIS DE AMBIENTE ==="
echo ""
echo "PATH:"
echo $PATH
echo ""
echo "Outras variáveis relevantes:"
env | grep -E "(NODE|DOCKER|POSTGRES|REDIS|COOLIFY|GRAFANA)" | head -10
echo ""

echo "=== CERTIFICADOS SSL ==="
echo ""
if [ -d "/etc/letsencrypt" ]; then
    echo "Let's Encrypt encontrado:"
    sudo ls -la /etc/letsencrypt/live/ 2>/dev/null | head -10
fi
if [ -d "/etc/ssl/certs" ]; then
    echo "Certificados SSL:"
    sudo ls /etc/ssl/certs/*.pem 2>/dev/null | head -5
fi
echo ""

echo "=== FIREWALL ==="
echo ""
if command -v ufw &> /dev/null; then
    echo "UFW Status:"
    sudo ufw status
elif command -v firewall-cmd &> /dev/null; then
    echo "Firewalld Status:"
    sudo firewall-cmd --list-all
elif command -v iptables &> /dev/null; then
    echo "IPTables Rules:"
    sudo iptables -L -n | head -20
else
    echo "Nenhum firewall detectado"
fi
echo ""

echo "=== LOGS RECENTES ==="
echo ""
echo "Últimas linhas do syslog:"
sudo tail -20 /var/log/syslog 2>/dev/null || sudo journalctl -n 20 --no-pager 2>/dev/null | head -20
echo ""

echo "=== INFORMAÇÕES DE REDE ==="
echo ""
echo "IPs da máquina:"
ip addr show | grep -E "inet " | grep -v "127.0.0.1"
echo ""
echo "Roteamento:"
ip route show | head -5
echo ""

echo "=== PROCESSOS EM EXECUÇÃO ==="
echo ""
echo "Top 10 processos por CPU:"
ps aux --sort=-%cpu | head -11
echo ""

echo "=== FIM DA COLETA ==="

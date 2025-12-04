#!/bin/bash
# Script para fazer deploy da Edge Function manage-coupons

echo "🚀 Iniciando deploy da função manage-coupons..."

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

# Verificar se está linkado ao projeto
if [ ! -f ".supabase/config.toml" ]; then
    echo "🔗 Fazendo link com o projeto..."
    supabase link --project-ref iwovfvrmjaonzqlaavmi
fi

# Deploy da função
echo "📦 Fazendo deploy da função..."
supabase functions deploy manage-coupons --no-verify-jwt

echo "✅ Deploy concluído!"
echo ""
echo "📍 URL da função:"
echo "   https://iwovfvrmjaonzqlaavmi.supabase.co/functions/v1/manage-coupons"
echo ""
echo "🧪 Teste com:"
echo "   curl https://iwovfvrmjaonzqlaavmi.supabase.co/functions/v1/manage-coupons"


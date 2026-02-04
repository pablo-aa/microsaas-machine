#!/usr/bin/env python3

"""
Script auxiliar para obter o Refresh Token do Google Ads API.
Este script ajuda a obter o refresh token necessário para autenticação
na API do Google Ads usando OAuth 2.0.

Uso:
  python obter_refresh_token.py

Você precisará:
  - Client ID do Google Cloud Console
  - Client Secret do Google Cloud Console
"""

import sys
from pathlib import Path

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except ImportError:
    print("❌ Biblioteca google-auth-oauthlib não encontrada.")
    print("Instale com: pip install google-auth-oauthlib")
    sys.exit(1)

# Escopo necessário para a API do Google Ads
SCOPES = ['https://www.googleapis.com/auth/adwords']


def obter_refresh_token():
    """Obtém o refresh token através do fluxo OAuth 2.0."""
    print("=" * 60)
    print("OBTENÇÃO DE REFRESH TOKEN - GOOGLE ADS API")
    print("=" * 60)
    print()

    # Solicitar credenciais do usuário
    print("Você precisa ter:")
    print("  1. Client ID do Google Cloud Console")
    print("  2. Client Secret do Google Cloud Console")
    print()

    client_id = input("Client ID: ").strip()
    if not client_id:
        print("❌ Client ID é obrigatório!")
        sys.exit(1)

    client_secret = input("Client Secret: ").strip()
    if not client_secret:
        print("❌ Client Secret é obrigatório!")
        sys.exit(1)

    print()
    print("Iniciando fluxo OAuth...")
    print("Uma janela do navegador será aberta para você autorizar o acesso.")
    print()

    try:
        # Configurar o fluxo OAuth
        flow = InstalledAppFlow.from_client_config(
            {
                "installed": {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": ["http://localhost"],
                }
            },
            SCOPES,
        )

        # Executar o fluxo OAuth (abre o navegador)
        credentials = flow.run_local_server(port=0)

        # Obter o refresh token
        refresh_token = credentials.refresh_token

        if refresh_token:
            print()
            print("=" * 60)
            print("✅ REFRESH TOKEN OBTIDO COM SUCESSO!")
            print("=" * 60)
            print()
            print("Adicione esta linha ao seu arquivo .env ou secrets:")
            print()
            print(f"GOOGLE_ADS_REFRESH_TOKEN={refresh_token}")
            print()
            print("⚠️  IMPORTANTE: Guarde este token com segurança!")
            print("   Ele não será exibido novamente.")
            print()

            # Perguntar se quer salvar automaticamente
            salvar = input("Deseja salvar automaticamente no arquivo .env local? (s/n): ").strip().lower()
            if salvar == "s":
                salvar_no_env(refresh_token)
        else:
            print("❌ Não foi possível obter o refresh token.")
            print("   Tente novamente ou verifique suas credenciais.")

    except Exception as e:
        print(f"❌ Erro ao obter refresh token: {e}")
        print()
        print("Possíveis causas:")
        print("  - Credenciais inválidas")
        print("  - API do Google Ads não ativada no projeto")
        print("  - Problemas de conexão")
        sys.exit(1)


def salvar_no_env(refresh_token: str):
    """Salva o refresh token no arquivo .env ao lado deste script."""
    env_path = Path(__file__).parent / ".env"

    try:
        # Ler arquivo existente se houver
        conteudo = ""
        if env_path.exists():
            with open(env_path, "r") as f:
                conteudo = f.read()

        # Verificar se já existe
        if "GOOGLE_ADS_REFRESH_TOKEN" in conteudo:
            # Substituir o valor existente
            linhas = conteudo.split("\n")
            novas_linhas = []
            for linha in linhas:
                if linha.startswith("GOOGLE_ADS_REFRESH_TOKEN="):
                    novas_linhas.append(f"GOOGLE_ADS_REFRESH_TOKEN={refresh_token}")
                else:
                    novas_linhas.append(linha)
            conteudo = "\n".join(novas_linhas)
        else:
            # Adicionar no final
            if conteudo and not conteudo.endswith("\n"):
                conteudo += "\n"
            conteudo += (
                "\n# Google Ads API\nGOOGLE_ADS_REFRESH_TOKEN="
                f"{refresh_token}\n"
            )

        # Salvar
        with open(env_path, "w") as f:
            f.write(conteudo)

        print(f"✅ Refresh token salvo em {env_path}")

    except Exception as e:
        print(f"⚠️  Erro ao salvar no .env: {e}")
        print("   Você pode adicionar manualmente ao arquivo .env")


if __name__ == "__main__":
    try:
        obter_refresh_token()
    except KeyboardInterrupt:
        print("\n\nOperação cancelada pelo usuário.")
        sys.exit(0)




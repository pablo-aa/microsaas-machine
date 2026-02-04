# Guia de estilo para documentação

Regras mínimas para manter a documentação clara e consistente.

## Voz e tempo

- Use **voz ativa** e **presente**: "O script copia os arquivos" em vez de "Os arquivos são copiados pelo script".
- Prefira **imperativo** em instruções: "Crie um arquivo .env" em vez de "Você deve criar um arquivo .env".
- Evite hedging desnecessário ("talvez", "pode ser que"); afirme com confiança quando o comportamento for estável.

## Títulos

- Use **sentence case** nos títulos: primeira letra maiúscula, resto em minúsculas, exceto nomes próprios e siglas (ex.: "Configuração do Dashboard", "Integração com Google Ads API").

## Linguagem

- Seja direto: frases curtas e objetivas.
- Evite jargão quando um termo mais simples bastar; quando usar termos técnicos, use-os de forma consistente.
- Evite fórmulas genéricas de abertura/fechamento ("É importante notar que...", "Em conclusão...").

## Código vs. prosa

- Use **blocos de código** para comandos, trechos de configuração, exemplos de API e trechos que alguém vá copiar.
- Use **prosa** para explicar o "porquê", o fluxo geral e decisões de desenho.
- Em listas de passos, prefira um bloco de código único quando forem comandos em sequência; use prosa quando cada passo exigir explicação.

## Links

- Em documentos que são publicados no site Docusaurus (docs/index.md e tudo que é sincronizado para docs-site), use **links absolutos** para outras páginas do site: `/vps`, `/qual-carreira-seguir/architecture`, `/dashboard/readme`. Evite links para caminhos de repositório (`../apps/...`) no conteúdo que vira página do site.
- Em READMEs dentro de apps, links relativos para outros arquivos do mesmo app são aceitáveis (ex.: `docs/INTEGRATIONS.md`).

## Dados sensíveis

- Não documente senhas, tokens, API keys ou valores reais de variáveis de ambiente. Use placeholders ou referências genéricas ("sua chave", "valor configurado no Coolify").

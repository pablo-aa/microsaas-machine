# Funcionalidades

## Dashboard (`/`)

- KPIs: faturamento total, gasto em anúncios, ROAS médio, pagamentos aprovados  
- Gráfico de faturamento (revenue vs ad spend, ROAS)  
- Gráfico de lucro  
- Funil de conversão: Forms Submitted → Payments Initiated → Payments Approved  
- Tabela detalhada de métricas diárias  
- Filtros de data: Hoje, Ontem, 7/14/30 dias, Histórico (90 dias), Personalizado  
- Cache: histórico cacheado; dia atual sempre atualizado  

## Assinantes (`/subscribers`)

- Lista paginada com nome, email, idade, link do teste, cupom, campanha, valor pago, data  
- Busca por nome, email, cupom ou campanha  
- Estatísticas do questionário (distribuição das 9 questões)  
- Idade média no cabeçalho  

## Cupons (`/coupons`)

- CRUD: criar, editar, ativar/desativar, excluir  
- Campos: código, desconto (%), descrição, expiração, máximo de usos, status  
- Cálculo: porcentagem ou valor final  
- Gerar link com cupom pré-aplicado  
- Aplicar desconto retroativo a testes/pagamentos já realizados  
- Busca por código; status: Ativo, Inativo, Expirado, Esgotado  

## Exportação (`/export`)

- Filtros de data (mesmos do dashboard)  
- Exportação em ZIP com CSV e JSON  
- Dados: nome, email, idade, status de pagamento, valor, cupom  
- Paginação em lotes; CSV com BOM UTF-8 para Excel  

## Autenticação

- **Login** (`/login`): email e senha via Supabase Auth. Rotas protegidas (exceto `/login` e `/signup`).  
- **Convites** (`/signup`): link com hash `#type=invite`; admin gera convite no Supabase; usuário define senha e é autenticado.  
- Sessão persistida; logout na navegação.  

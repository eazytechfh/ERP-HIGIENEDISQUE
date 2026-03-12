# Auth e Perfis (Backend v1)

## Objetivo
Definir autentica??o, autoriza??o e escopo de acesso para os m?dulos do ERP HIGIENE DISQUE.

## Estrat?gia de autentica??o
- M?todo: JWT com `access_token` curto e `refresh_token` rotativo.
- Canal: HTTPS obrigat?rio.
- Sess?o:
  - `access_token`: 15 minutos.
  - `refresh_token`: 7 dias, armazenado com hash no backend.
- Revoga??o: blacklist por `jti` de refresh token e invalida??o por logout.

## Perfis
- `admin`: acesso total ao sistema e usu?rios.
- `operacional`: clientes, contratos, servi?os/OS, estoque, equipe, ve?culos.
- `financeiro`: leitura de clientes/contratos/servi?os + escrita no financeiro.
- `tecnico`: leitura de OS atribu?das e atualiza??o de execu??o/baixa.
- `consulta`: somente leitura.

## Matriz de permiss?o (resumo)
- Clientes:
  - `admin`, `operacional`: CRUD
  - `financeiro`: leitura
  - `tecnico`: leitura restrita (clientes com OS atribu?da)
  - `consulta`: leitura
- Contratos:
  - `admin`, `operacional`: CRUD
  - `financeiro`, `consulta`: leitura
  - `tecnico`: sem acesso
- Servi?os/OS:
  - `admin`, `operacional`: CRUD
  - `tecnico`: atualizar status/baixa nas OS atribu?das
  - `financeiro`, `consulta`: leitura
- Estoque:
  - `admin`, `operacional`: CRUD
  - `tecnico`: leitura
  - `financeiro`, `consulta`: leitura
- Financeiro:
  - `admin`, `financeiro`: CRUD
  - demais: leitura (ou sem acesso, conforme pol?tica final)

## Claims JWT (m?nimo)
- `sub`: id do usu?rio
- `email`
- `role`: perfil principal
- `permissions`: permiss?es granulares
- `iat`, `exp`, `jti`

## Regras obrigat?rias de seguran?a
- Password hashing com Argon2id ou bcrypt (cost alto).
- Rate limit em `/auth/login` e `/auth/refresh`.
- Auditoria de eventos cr?ticos:
  - login/logout
  - cria??o/edi??o/exclus?o de cliente
  - cria??o/exclus?o de OS
  - baixa de OS
  - altera??es de estoque
- Soft delete para entidades cr?ticas (`clientes`, `servicos`, `contratos`).

## Endpoints de auth (v1)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Crit?rio de pronto
- Todas as rotas protegidas por middleware de JWT.
- Valida??o de escopo por perfil e permiss?o granular.
- Logs de auditoria persistidos com `userId`, `action`, `entity`, `entityId`, `timestamp`.

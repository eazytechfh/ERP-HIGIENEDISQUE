# Plano de Migracao: localStorage -> API

## Objetivo
Migrar gradualmente os dados do frontend para backend sem interromper os fluxos operacionais.

## Premissas
- Frontend atual segue funcional com `lib/flow-store.ts`.
- Haver? modo h?brido durante a migra??o.
- Regras de neg?cio atuais devem permanecer id?nticas no backend.

## Fase 0: Preparacao (1-2 dias)
- Congelar contrato de API (`docs/backend/OPENAPI-V1.yaml`).
- Congelar auth/perfis (`docs/backend/AUTH-PERFIS.md`).
- Criar migrations iniciais do banco.
- Criar tabela de auditoria.

## Fase 1: Backend base (3-5 dias)
- Implementar auth JWT + refresh.
- Implementar m?dulos:
  - `clientes`
  - `contratos`
  - `servicos` (inclui OS e baixa)
  - `produtos`
- Validar RBAC por rota.
- Publicar ambiente de homologa??o.

## Fase 2: Adapter no frontend (2-3 dias)
- Introduzir camada `DataProvider` com fallback:
  - `mode=api`: l?/escreve API
  - `mode=local`: mant?m comportamento atual
- Chave de controle por vari?vel de ambiente (`NEXT_PUBLIC_DATA_MODE`).
- Telas piloto com API:
  - Clientes
  - Servi?os/OS

## Fase 3: Migracao de dados existentes (1-2 dias)
- Criar script de import do `localStorage` para API (por tenant/usu?rio).
- Estrat?gia:
  - export local JSON
  - valida??o
  - import idempotente
- Confer?ncia de contagem por entidade:
  - clientes
  - contratos
  - servicos
  - produtos

## Fase 4: Cutover (1 dia)
- Virar `NEXT_PUBLIC_DATA_MODE=api` em produ??o.
- Congelar grava??es em localStorage.
- Monitorar erros por 24-48h.

## Fase 5: Pos-cutover (1-2 dias)
- Remover fallback de escrita local.
- Manter leitura legada apenas para conting?ncia curta.
- Fechar pend?ncias de auditoria e performance.

## Checklist de aceite
- Auth com refresh e logout funcionando.
- RBAC validado por perfil.
- Fluxos cr?ticos testados ponta a ponta:
  - cadastro cliente
  - gerar OS
  - ver/imprimir OS
  - dar baixa com assinatura/respons?vel
  - excluir OS
  - filtro assinadas
- Dashboard consistente com dados de backend.
- CSV de clientes exportando do backend.
- Sem diverg?ncia de contagem entre local e API p?s-import.

## Risco e mitigacao
- Risco: diverg?ncia de regra entre front e backend.
  - Mitiga??o: testes de contrato e cen?rios E2E dos fluxos cr?ticos.
- Risco: duplica??o de OS no cutover.
  - Mitiga??o: constraint ?nica por `osFingerprint` + `clienteId` + `data`.
- Risco: regress?o no desempenho.
  - Mitiga??o: pagina??o, ?ndices e cache para listagens.

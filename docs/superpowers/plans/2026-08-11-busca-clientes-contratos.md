# Correção da Busca de Clientes em Contratos — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar na branch `dev` a correção que pesquisa clientes de contratos no Supabase e promover a `dev` para a branch de destino confirmada pelo usuário.

**Architecture:** A página de contratos continuará usando `listClientesSupabase`, mas enviará o termo de busca ao servidor após debounce de 300 ms e limitará cada resposta a 50 clientes. Quando `clienteId` não estiver no lote corrente, a página usará `getClienteSupabase` para carregar diretamente o cliente selecionado.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase e `node:test`.

## Global Constraints

- Trabalhar sobre `dev` atualizada a partir de `origin/dev`.
- Aplicar somente a alteração contida em `higienedisquecontrato.patch` e seu teste regressivo.
- Usar fast-forward quando possível e não promover para uma branch não confirmada.

---

### Task 1: Regressão da busca de clientes

**Files:**
- Create: `tests/contratos-client-search.test.js`
- Modify: `app/dashboard/clientes/contratos/page.tsx:34`
- Modify: `app/dashboard/clientes/contratos/page.tsx:100`

**Interfaces:**
- Consumes: `listClientesSupabase(params?: ListClientesParams)` e `getClienteSupabase(clienteId: string)`.
- Produces: busca remota com `{ pageSize: 50, search }`, debounce de 300 ms e carregamento direto por `clienteId`.

- [ ] **Step 1: Escrever o teste regressivo**

Criar um teste com `node:test` que leia a página e exija o uso de `getClienteSupabase`, `pageSize: 50`, `search: searchTerm || undefined`, debounce de 300 ms e a remoção de `pageSize: 9999`.

- [ ] **Step 2: Executar o teste e confirmar RED**

Run: `node --test tests/contratos-client-search.test.js`

Expected: FAIL porque a página ainda contém `pageSize: 9999` e não possui a busca remota.

- [ ] **Step 3: Aplicar a implementação mínima**

Run: `git apply C:\Users\Desktop\Downloads\patch\higienedisquecontrato.patch`

Expected: o patch altera somente `app/dashboard/clientes/contratos/page.tsx`.

- [ ] **Step 4: Executar o teste e confirmar GREEN**

Run: `node --test tests/contratos-client-search.test.js`

Expected: PASS.

- [ ] **Step 5: Validar o projeto**

Run: `npm run lint` e `npm run build`.

Expected: ambos terminam sem erros introduzidos pela correção.

- [ ] **Step 6: Commitar e publicar a dev**

Run: `git add app/dashboard/clientes/contratos/page.tsx tests/contratos-client-search.test.js docs/superpowers/plans/2026-08-11-busca-clientes-contratos.md`, `git commit -m "fix: corrige busca de clientes em contratos"` e `git push origin dev`.

Expected: `origin/dev` aponta para o novo commit.

### Task 2: Promover a branch de deploy

**Files:**
- Modify: histórico Git da branch de destino confirmada pelo usuário.

**Interfaces:**
- Consumes: commit validado e publicado em `origin/dev`.
- Produces: branch de destino contendo a mesma correção.

- [ ] **Step 1: Confirmar o nome da branch de destino**

Obter do usuário o trecho que faltou após “a branch dev passe para a branch”.

- [ ] **Step 2: Integrar `dev` na branch confirmada**

Atualizar a branch de destino, integrar `dev` sem reescrever histórico e executar novamente o teste regressivo.

- [ ] **Step 3: Publicar a branch confirmada**

Enviar a integração ao remoto e confirmar que os hashes local e remoto coincidem.

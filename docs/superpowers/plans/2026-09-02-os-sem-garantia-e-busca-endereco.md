# OS sem Garantia e Busca por Endereço Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Usar o pedido de serviço correto e sem garantia para gordura/resíduos e permitir localizar clientes pelo endereço.

**Architecture:** Extrair a classificação do tipo de serviço para uma função pura compartilhada pela tela de OS. Passar explicitamente a condição “sem garantia” ao documento de desentupimento/gordura e ampliar a consulta Supabase com IDs encontrados em `cliente_locais`.

**Tech Stack:** TypeScript, React 19, Next.js 16, Supabase/PostgREST, Node test runner.

## Global Constraints

- Limpeza de caixa de gordura e transporte de resíduos não possuem garantia.
- Transporte de resíduos usa o mesmo template de limpeza de caixa de gordura.
- O aviso deve ficar acima de “Atesto que o técnico...”.
- Clientes devem ser pesquisáveis pelos campos do endereço cadastrado.

---

### Task 1: Classificação do transporte de resíduos

**Files:**
- Create: `components/os-generation/tipo-os.ts`
- Create: `components/os-generation/tipo-os.test.ts`
- Modify: `app/dashboard/servicos/page.tsx`

**Interfaces:**
- Produces: `classificarTipoOS(nome, categoria)` e `servicoSemGarantia(nome)`.

- [x] Escrever testes para resíduos, gordura, reservatórios e vetores.
- [x] Confirmar que falham sem o módulo.
- [x] Implementar a classificação e usá-la em formulário, preview e regras da OS.
- [x] Confirmar aprovação dos testes.

### Task 2: Aviso de serviço sem garantia

**Files:**
- Modify: `components/os-generation/pdf-preview-mock.tsx`
- Modify: `components/os-generation/os-document-desentupimento.tsx`
- Test: `components/os-generation/tipo-os.test.ts`

**Interfaces:**
- Consumes: `servicoSemGarantia(nome)`.
- Produces: prop `semGarantia?: boolean` no documento.

- [x] Passar a regra do serviço para a prévia.
- [x] Renderizar “Estou ciente de que esse serviço não possui garantia” imediatamente antes do atesto.
- [x] Impedir certificado de garantia para gordura e resíduos.

### Task 3: Busca de clientes por endereço

**Files:**
- Create: `lib/supabase/clientes-search.ts`
- Create: `lib/supabase/clientes-search.test.ts`
- Modify: `lib/supabase/clientes-repo.ts`
- Modify: `app/dashboard/clientes/page.tsx`

**Interfaces:**
- Produces: `buildClienteTextSearchFilter(term, localClientIds)`.

- [x] Escrever testes para filtro por nome e IDs de locais.
- [x] Confirmar que falham sem o módulo.
- [x] Consultar `cliente_locais` por endereço, número, bairro, cidade, CEP e nome do local.
- [x] Combinar os IDs retornados com a busca por nome e atualizar o texto de ajuda.
- [x] Executar toda a suíte e o build de produção.

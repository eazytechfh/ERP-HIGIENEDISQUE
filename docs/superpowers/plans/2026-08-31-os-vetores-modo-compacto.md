# OS de Vetores em Modo Compacto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manter em uma unica folha A4 a OS de vetores com cinco a sete produtos, sem dividir o quadro de assinaturas.

**Architecture:** Uma funcao pura determina quando o documento recebe a classe `os-vetores-dense`. O CSS dessa classe reduz apenas espacamentos verticais, linhas da tabela de produtos e espacos de assinatura; documentos com ate quatro produtos mantem o layout atual.

**Tech Stack:** TypeScript, React, CSS de impressao, Node test runner.

## Global Constraints

- Ativar o modo compacto somente com mais de quatro produtos.
- Nao remover nem ocultar produtos ou textos legais.
- Nao alterar OS de limpeza, desentupimento ou certificado.
- Manter o quadro de assinaturas inteiro.

---

### Task 1: Regra de densidade

**Files:**
- Create: `components/os-generation/vetores-print-density.ts`
- Create: `components/os-generation/vetores-print-density.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: quantidade de produtos.
- Produces: `getVetoresPrintDensityClass(productCount: number): "" | "os-vetores-dense"`.

- [x] **Step 1: Write the failing test**

Testar que quatro produtos retornam string vazia e cinco retornam `os-vetores-dense`.

- [x] **Step 2: Run test to verify it fails**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-strip-types components/os-generation/vetores-print-density.test.ts`

Expected: FAIL porque o modulo ainda nao existe.

- [x] **Step 3: Write minimal implementation**

Criar a funcao pura com limiar `productCount > 4` e incluir o teste na suite `npm test`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test`

Expected: todos os testes passam.

### Task 2: Layout compacto da OS

**Files:**
- Modify: `components/os-generation/os-document-vetores.tsx`

**Interfaces:**
- Consumes: `getVetoresPrintDensityClass(dadosTecnicos.produtos.length)`.
- Produces: classe condicional na raiz, tabela de produtos compacta e quadro `.os-vetores-signatures` indivisivel.

- [x] **Step 1: Apply the density class**

Adicionar a classe retornada pela funcao pura ao elemento `.os-a4-page`.

- [x] **Step 2: Add targeted compact CSS**

Reduzir padding da pagina e das celulas, margens entre secoes, fonte do texto legal e espacadores de assinatura somente sob `.os-vetores-dense`.

- [x] **Step 3: Protect signatures**

Adicionar `break-inside: avoid` e `page-break-inside: avoid` a `.os-vetores-signatures`.

- [x] **Step 4: Run full verification**

Run: `npm test`

Expected: todos os testes passam.

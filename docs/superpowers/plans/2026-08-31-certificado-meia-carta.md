# Certificado Meia-carta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Imprimir o certificado em uma unica folha meia-carta paisagem na Epson L4150 sem alterar a OS A4 nem remover o perfil A5 existente.

**Architecture:** Adicionar um perfil `certificate-half-letter` ao gerador central de impressao, com pagina de 215.9 x 139.7 mm, margens `2mm 4mm 4mm 4mm` e canvas limitado a area imprimivel. O botao do certificado passara a usar esse perfil; o perfil `certificate` continuara representando A5.

**Tech Stack:** TypeScript, React, CSS `@page`, Node test runner.

## Global Constraints

- Preservar a impressao A4 das ordens de servico.
- Preservar o perfil A5 existente.
- Usar meia-carta paisagem: 215.9 mm x 139.7 mm.
- Manter as margens: topo 2 mm; direita, inferior e esquerda 4 mm.
- Nao aplicar o deslocamento vertical de 15 mm ao perfil meia-carta.

---

### Task 1: Perfil fisico meia-carta

**Files:**
- Modify: `components/os-generation/print-utils.ts`
- Test: `components/os-generation/print-utils.test.ts`

**Interfaces:**
- Consumes: `PrintOptions.page`.
- Produces: `page: "certificate-half-letter"` em `buildPrintDocument` e `openPrintWindow`.

- [x] **Step 1: Write the failing test**

Adicionar um teste que solicite `certificate-half-letter` e exija `@page { size: 215.9mm 139.7mm; margin: 2mm 4mm 4mm 4mm; }`, dimensoes de 100% e classe propria sem `translate(3mm, 15mm)`.

- [x] **Step 2: Run test to verify it fails**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-strip-types --test-name-pattern="half-letter" components/os-generation/print-utils.test.ts`

Expected: FAIL porque o perfil ainda nao existe.

- [x] **Step 3: Write minimal implementation**

Expandir `PrintOptions.page`, selecionar tamanho/margens/dimensoes por perfil e emitir `half-letter-certificate-print` no `body`.

- [x] **Step 4: Run tests and verify they pass**

Run: `npm test`

Expected: todos os testes passam.

### Task 2: Usar meia-carta no botao do certificado

**Files:**
- Modify: `components/os-generation/pdf-preview-mock.tsx`
- Test: `components/os-generation/print-utils.test.ts`

**Interfaces:**
- Consumes: `openPrintWindow(..., { page: "certificate-half-letter" })`.
- Produces: trabalho de impressao do certificado configurado para meia-carta.

- [x] **Step 1: Change the certificate print call**

Substituir `page: "certificate"` por `page: "certificate-half-letter"` somente em `handlePrintCertificado`.

- [x] **Step 2: Run full verification**

Run: `npm test`

Expected: todos os testes passam e a OS continua A4.

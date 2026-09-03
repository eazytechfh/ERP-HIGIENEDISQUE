# Ajuste do Certificado A5 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o certificado preencher corretamente uma folha A5 paisagem, mantendo uma margem interna segura de 5 mm.

**Architecture:** A página física de impressão terá 210 × 148 mm e margem externa zero; o certificado aplicará a margem segura como padding interno. A tabela principal ocupará 100% da altura útil para eliminar o espaço vazio abaixo do conteúdo.

**Tech Stack:** TypeScript, React, CSS de impressão, Node test runner.

## Global Constraints

- Não alterar a impressão A4 das ordens de serviço.
- Preservar 5 mm de segurança em torno da moldura.
- Manter o certificado em A5 paisagem.

---

### Task 1: Dimensionar a página física A5

**Files:**
- Modify: `components/os-generation/print-utils.test.ts`
- Modify: `components/os-generation/print-utils.ts`
- Modify: `components/os-generation/certificado-garantia.tsx`

**Interfaces:**
- Consumes: opção de impressão `page: "certificate"`.
- Produces: página A5 de 210 × 148 mm com área útil interna de 200 × 138 mm.

- [x] **Step 1: Write the failing test** exigindo margem externa zero, dimensões físicas e padding interno.
- [x] **Step 2: Run test to verify it fails** com `npm test`.
- [x] **Step 3: Write minimal implementation** no CSS de impressão e no componente.
- [x] **Step 4: Run test to verify it passes** com `npm test`.

# Técnico Responsável vindo da Equipe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir na OS o responsável técnico ativo cadastrado na equipe, eliminando o nome fixo de Renato.

**Architecture:** Uma função pura seleciona o melhor responsável ativo por cargo e perfil. A página de serviços mantém os registros completos da equipe e sincroniza o nome selecionado nos modelos de vetores e limpeza; documentos deixam de aplicar fallbacks pessoais fixos.

**Tech Stack:** TypeScript, React, Supabase, Node test runner.

## Global Constraints

- Não associar o CRBio de uma pessoa a outra.
- Priorizar cargo explícito de responsável técnico ou formação técnica.
- Considerar apenas membros ativos.
- Manter o campo da OS editável.

---

### Task 1: Selecionar o responsável da equipe

**Files:**
- Create: `components/os-generation/tecnico-responsavel.ts`
- Create: `components/os-generation/tecnico-responsavel.test.ts`
- Modify: `package.json`

- [x] **Step 1: Write failing tests for active veterinary/technical profile selection**.
- [x] **Step 2: Verify expected module-not-found failure**.
- [x] **Step 3: Implement normalized priority selection**.

### Task 2: Integrar a equipe aos documentos

**Files:**
- Modify: `app/dashboard/servicos/page.tsx`
- Modify: `components/os-generation/os-document-vetores.tsx`
- Modify: `components/os-generation/os-document-limpeza.tsx`
- Modify: `components/os-generation/pdf-preview-mock.tsx`

- [x] **Step 1: Retain full active team records in services state**.
- [x] **Step 2: Synchronize selected name into vector and cleaning OS data**.
- [x] **Step 3: Remove Renato/CRBio fixed fallbacks**.
- [x] **Step 4: Run all tests and validate diff**.

# Correcao da Data da OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantir que a data civil escolhida no agendamento seja exibida e gravada na OS sem recuar um dia por conversao de fuso horario.

**Architecture:** Centralizar a interpretacao e a formatacao de valores `YYYY-MM-DD` em um utilitario que constroi datas no calendario local, sem passar pelo parser UTC de `new Date(string)`. Substituir todas as formatacoes diretas da data agendada na tela de servicos e no documento da OS pelo utilitario testado.

**Tech Stack:** TypeScript, React/Next.js 16, Node.js `node:test`.

## Global Constraints

- Preservar o valor de calendario informado pelo usuario, independentemente do fuso horario local.
- Nao alterar o armazenamento nem o formato `YYYY-MM-DD` do agendamento.
- Preservar alteracoes preexistentes e limitar a correcao ao fluxo de data da OS.

---

### Task 1: Utilitario de data civil e teste de regressao

**Files:**
- Create: `lib/date-only.ts`
- Create: `lib/date-only.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: valor de data civil no formato `YYYY-MM-DD`.
- Produces: `parseDateOnlyLocal(value: string): Date` e `formatDateOnlyBR(value: string): string`.

- [x] **Step 1: Escrever o teste que reproduz o erro**

```ts
import assert from "node:assert/strict"
import test from "node:test"
import { formatDateOnlyBR, parseDateOnlyLocal } from "./date-only.ts"

test("preserva 12/08/2026 ao formatar a data civil da OS", () => {
  assert.equal(formatDateOnlyBR("2026-08-12"), "12/08/2026")
})

test("interpreta a data civil no calendario local", () => {
  const date = parseDateOnlyLocal("2026-08-12")
  assert.deepEqual([date.getFullYear(), date.getMonth(), date.getDate()], [2026, 7, 12])
})
```

- [x] **Step 2: Executar o teste e confirmar a falha**

Run: `node --test --experimental-strip-types lib/date-only.test.ts`

Expected: FAIL porque `lib/date-only.ts` ainda nao existe.

- [x] **Step 3: Implementar o utilitario minimo**

```ts
export function parseDateOnlyLocal(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateOnlyBR(value: string): string {
  return parseDateOnlyLocal(value).toLocaleDateString("pt-BR")
}
```

- [x] **Step 4: Adicionar o comando de teste e confirmar o verde**

Em `package.json`, adicionar `"test": "node --test --experimental-strip-types lib/date-only.test.ts"` aos scripts.

Run: `npm test`

Expected: PASS para os dois testes.

### Task 2: Aplicar a data civil em todo o fluxo da OS

**Files:**
- Modify: `app/dashboard/servicos/page.tsx`
- Test: `lib/date-only.test.ts`

**Interfaces:**
- Consumes: `formatDateOnlyBR` para texto e `parseDateOnlyLocal` para calculos de garantia.
- Produces: resumo, confirmacao, certificado e PDF da OS sempre com a mesma data selecionada.

- [x] **Step 1: Importar os utilitarios**

```ts
import { formatDateOnlyBR, parseDateOnlyLocal } from "@/lib/date-only"
```

- [x] **Step 2: Remover as interpretacoes UTC da data agendada**

Substituir cada `new Date(serviceRequest.schedule.date).toLocaleDateString("pt-BR")` por `formatDateOnlyBR(serviceRequest.schedule.date)`, inclusive a prop `dataServico` enviada ao `PdfPreviewMock`. Substituir `new Date(`${serviceRequest.schedule.date}T00:00:00`)` por `parseDateOnlyLocal(serviceRequest.schedule.date)` para centralizar o comportamento.

- [x] **Step 3: Executar verificacoes automatizadas**

Run: `npm test`

Expected: PASS.

Run: `npm run lint`

Expected: sem novos erros provocados pela mudanca.

Run: `npm run build`

Expected: build concluido com sucesso.

Resultado: testes e build passaram. O lint nao executou porque o projeto nao possui o binario `eslint` instalado; a verificacao TypeScript isolada tambem ficou bloqueada pela ausencia preexistente de `node_modules/@types/node/index.d.ts`.

- [x] **Step 4: Revisar o diff final**

Run: `git diff --check` e `git diff -- app/dashboard/servicos/page.tsx lib/date-only.ts lib/date-only.test.ts package.json`

Expected: nenhum problema de whitespace; apenas a correcao centralizada da data, o teste e o script correspondente.

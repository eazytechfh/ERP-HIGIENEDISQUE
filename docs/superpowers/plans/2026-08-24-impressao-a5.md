# Certificado em A5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir somente o Certificado de Garantia no dialogo de impressao ja dimensionado para papel A5 paisagem, sem ajuste manual de escala.

**Architecture:** Manter OS, recibo, historico e contratos em seus formatos atuais. Alterar exclusivamente a pagina nomeada `certificado` e o componente visual do certificado, reduzindo suas dimensoes fisicas de A4 paisagem para a area util de um A5 paisagem.

**Tech Stack:** Next.js 16, React 19, TypeScript e CSS Paged Media (`@page`, milimetros).

## Global Constraints

- Escopo exclusivo: Certificado de Garantia.
- Papel: ISO A5 paisagem, 210 mm x 148 mm.
- Margens: 5 mm; area util: 200 mm x 138 mm.
- A OS permanece A4 e nao deve sofrer alteracao visual ou de impressao.
- O certificado continua em um job separado da OS.
- O navegador pode sugerir A5 paisagem; bandeja e preferencias bloqueadas continuam sob controle do navegador/driver.

---

### Task 1: Criar uma pagina de impressao A5 exclusiva para o certificado

**Files:**
- Modify: `components/os-generation/print-utils.ts`
- Create: `components/os-generation/print-utils.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: HTML com a classe `.certificado-a5-page`.
- Produces: pagina nomeada `certificado` em A5 paisagem, sem alterar a pagina A4 padrao da OS.

- [ ] **Step 1: Escrever teste de regressao para OS A4 e certificado A5**

```ts
import assert from "node:assert/strict"
import test from "node:test"
import { buildPrintDocument } from "./print-utils.ts"

test("mantem a OS em A4 e configura somente o certificado em A5 paisagem", () => {
  const html = buildPrintDocument('<div class="certificado-a5-page">Certificado</div>', "Certificado")

  assert.match(html, /@page\s*{\s*size:\s*A4;\s*margin:\s*5mm;/)
  assert.match(html, /@page certificado\s*{\s*size:\s*A5 landscape;\s*margin:\s*5mm;/)
  assert.match(html, /\.certificado-a5-page\s*{[^}]*width:\s*200mm;[^}]*min-height:\s*138mm;/s)
  assert.doesNotMatch(html, /\.certificado-a4-page/)
})
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-strip-types components/os-generation/print-utils.test.ts`

Expected: FAIL porque a pagina nomeada ainda usa `A4 landscape` e a classe ainda mede `287 x 200 mm`.

- [ ] **Step 3: Alterar apenas as regras do certificado**

Em `baseStyle`, preservar literalmente as regras da OS e substituir somente as regras do certificado:

```css
@page { size: A4; margin: 5mm; }
@page certificado { size: A5 landscape; margin: 5mm; }
.os-a4-page { width: 200mm; min-height: 287mm; margin: 0 auto; }
.certificado-a5-page { page: certificado; width: 200mm; min-height: 138mm; margin: 0 auto; }
```

- [ ] **Step 4: Incluir o teste no script do projeto**

Em `package.json`:

```json
"test": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-strip-types lib/date-only.test.ts components/os-generation/print-utils.test.ts"
```

- [ ] **Step 5: Executar os testes**

Run: `pnpm test`

Expected: todos os testes PASS.

- [ ] **Step 6: Commit**

```bash
git add components/os-generation/print-utils.ts components/os-generation/print-utils.test.ts package.json
git commit -m "feat: configure certificate printing for A5"
```

### Task 2: Redimensionar o layout do certificado para a area util A5

**Files:**
- Modify: `components/os-generation/certificado-garantia.tsx`

**Interfaces:**
- Consumes: `.certificado-a5-page` da Task 1.
- Produces: certificado com largura integral dentro de 200 mm; conteudo vertical excepcionalmente longo pode continuar em uma segunda folha A5 sem ser truncado.

- [ ] **Step 1: Trocar a raiz A4 pela raiz A5**

```tsx
className="certificado-a5-page bg-white text-black mx-auto"
style={{
  width: "200mm",
  minHeight: "138mm",
  padding: "0",
  fontFamily: "Arial, sans-serif",
  fontSize: "11px",
  lineHeight: 1.1,
  pageBreakBefore: pageBreakBefore ? "always" : "auto",
}}
```

- [ ] **Step 2: Reduzir o cabecalho proporcionalmente**

Usar grade `104mm 1fr`, gap `3.5mm`, imagem `104mm x 27mm`, dados da empresa em `10px` e nome da empresa em `17px`. Alterar o titulo “CERTIFICADO DE GARANTIA” de `27px` para `19px`.

- [ ] **Step 3: Adaptar grade e tipografia dos dados**

Na grade de cliente/endereco, usar `26mm 1fr 26mm 29mm`, gaps de `2mm` e fonte de `10px`. Em `InfoHeaderCell`, usar rotulo `10px`, valor `11px` e altura `10mm`. Reduzir a descricao do servico para `11px` com padding vertical de `2.3mm`.

- [ ] **Step 4: Adaptar tabelas, observacoes e assinatura**

Usar `11px` no cabecalho da tabela, `10px` no corpo, linhas com `4.5mm`, observacoes com altura minima de `14mm`, assinatura com margem inferior de `5.5mm` e textos finais de `9px`/`8px`.

- [ ] **Step 5: Verificar que nenhuma dimensao A4 ficou no certificado**

Run: `rg -n "certificado-a4|287mm|198mm|150mm|39mm" components/os-generation/certificado-garantia.tsx components/os-generation/print-utils.ts`

Expected: nenhum resultado.

- [ ] **Step 6: Executar validacoes automaticas**

Run: `pnpm test && pnpm lint && pnpm build`

Expected: testes PASS, lint sem novos erros e build concluido.

- [ ] **Step 7: Commit**

```bash
git add components/os-generation/certificado-garantia.tsx
git commit -m "feat: fit warranty certificate to A5 landscape"
```

### Task 3: Validar impressao sem redimensionamento manual

**Files:**
- Modify: `docs/superpowers/plans/2026-08-24-impressao-a5.md` (registrar resultado)

**Interfaces:**
- Consumes: certificado A5 das Tasks 1 e 2.
- Produces: evidencia de aceite no navegador e na impressora usada pela operacao.

- [ ] **Step 1: Testar os tres tipos de certificado**

Gerar certificados de pragas, limpeza de reservatorio e caixa de gordura, incluindo um exemplo com cliente/endereco longos e mais de tres itens.

- [ ] **Step 2: Conferir a previa no Chrome ou Edge**

Confirmar A5, orientacao paisagem, escala 100%, margens de 5 mm, QR code inteiro e tabela sem corte horizontal. Casos usuais de ate tres itens devem ocupar uma pagina; conteudo maior pode continuar em outra folha A5 para preservar todos os dados.

- [ ] **Step 3: Conferir que a OS nao mudou**

Abrir a impressao da OS e confirmar que ela continua A4 retrato e visualmente igual ao comportamento anterior.

- [ ] **Step 4: Testar a impressora fisica**

Carregar A5 na bandeja habitual e imprimir um certificado. O aceite exige nao selecionar “Ajustar”, nao alterar porcentagem e nao redimensionar manualmente.

- [ ] **Step 5: Registrar eventual limitacao do driver**

Se o driver ignorar o `@page`, registrar modelo da impressora, navegador e configuracao exigida; a aplicacao nao consegue forcar bandeja ou preferencias que o driver nao exponha ao CSS.

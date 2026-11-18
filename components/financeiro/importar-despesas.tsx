"use client"

import { useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  lerDespesasPlanilha,
  normalizarTexto,
  separarDuplicadas,
  type ErroImportacao,
  type LinhaDespesaImportada,
} from "@/lib/financeiro-importacao"
import {
  importarDespesasSupabase,
  listarTodosLancamentosSupabase,
  type FinanceiroCategoriaItem,
  type ResultadoImportacaoDespesas,
} from "@/lib/supabase/financeiro-repo"

type Props = {
  categorias: FinanceiroCategoriaItem[]
  /** So o aprovador do financeiro importa despesas ja baixadas (conferido tambem no banco). */
  isAprovador: boolean
  /** Chamado depois de importar, para a tela recarregar categorias, totais e aprovacoes. */
  onConcluido: () => void
}

type Previa = {
  arquivo: string
  novas: LinhaDespesaImportada[]
  duplicadas: LinhaDespesaImportada[]
  erros: ErroImportacao[]
}

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0)
}

function dataBr(iso: string) {
  const [a, m, d] = iso.split("-")
  return `${d}/${m}/${a}`
}

function mensagemDeErro(error: unknown) {
  return error instanceof Error ? error.message : "Erro inesperado."
}

export function ImportarDespesasButton({ categorias, isAprovador, onConcluido }: Props) {
  const [aberto, setAberto] = useState(false)
  const [lendo, setLendo] = useState(false)
  const [importando, setImportando] = useState(false)
  const [progresso, setProgresso] = useState("")
  const [previa, setPrevia] = useState<Previa | null>(null)
  const [erro, setErro] = useState("")
  const [resultado, setResultado] = useState<ResultadoImportacaoDespesas | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reiniciar = () => {
    setPrevia(null)
    setErro("")
    setResultado(null)
    setProgresso("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const abrir = () => {
    reiniciar()
    setAberto(true)
  }

  const fechar = (open: boolean) => {
    if (importando) return
    setAberto(open)
  }

  const lerArquivo = async (arquivo: File) => {
    setErro("")
    setPrevia(null)
    setResultado(null)
    if (!/\.xlsx$/i.test(arquivo.name)) {
      setErro("Envie um arquivo Excel no formato .xlsx.")
      return
    }

    setLendo(true)
    try {
      const { readSheet } = await import("read-excel-file/universal")
      const linhasBrutas = await readSheet(arquivo)
      const { linhas, erros } = lerDespesasPlanilha(linhasBrutas as any)

      let novas = linhas
      let duplicadas: LinhaDespesaImportada[] = []
      if (linhas.length > 0) {
        const datas = linhas.map((l) => l.dataPagamento).sort()
        const existentes = await listarTodosLancamentosSupabase({
          dataInicio: datas[0],
          dataFim: datas[datas.length - 1],
          tipo: "despesa",
        })
        ;({ novas, duplicadas } = separarDuplicadas(
          linhas,
          existentes
            .filter((e) => e.status !== "cancelado")
            .map((e) => ({ dataPagamento: e.dataVencimento, valor: e.valor, descricao: e.descricao })),
        ))
      }
      setPrevia({ arquivo: arquivo.name, novas, duplicadas, erros })
    } catch (e) {
      setErro(`Nao foi possivel ler a planilha: ${mensagemDeErro(e)}`)
    } finally {
      setLendo(false)
    }
  }

  const importar = async () => {
    if (!previa || previa.novas.length === 0) return
    setImportando(true)
    setErro("")
    try {
      const res = await importarDespesasSupabase({
        linhas: previa.novas,
        categorias,
        arquivo: previa.arquivo,
        onProgresso: setProgresso,
      })
      setResultado(res)
      setPrevia(null)
      onConcluido()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setImportando(false)
      setProgresso("")
    }
  }

  const totalNovas = previa ? previa.novas.reduce((soma, l) => soma + l.valor, 0) : 0
  const categoriasExistentes = new Set(categorias.filter((c) => c.tipo === "despesa").map((c) => normalizarTexto(c.nome)))
  const categoriasNovas = previa
    ? [...new Set(previa.novas.map((l) => l.categoria))].filter((nome) => !categoriasExistentes.has(normalizarTexto(nome)))
    : []

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={abrir}
        disabled={!isAprovador}
        title={isAprovador ? undefined : "Somente o aprovador do financeiro pode importar despesas."}
      >
        <Upload className="h-4 w-4" />
        Importar despesas
      </Button>

      <Dialog open={aberto} onOpenChange={fechar}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Importar despesas de planilha
            </DialogTitle>
            <DialogDescription>
              Planilha Excel (.xlsx) com as colunas Data de pagamento, Valor, Quem recebeu, Categoria do gasto e
              Descrição original da linha do extrato. As despesas entram já pagas, na data da planilha.
            </DialogDescription>
          </DialogHeader>

          {!resultado ? (
            <div className="space-y-4">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={lendo || importando}
                onChange={(e) => {
                  const arquivo = e.target.files?.[0]
                  if (arquivo) void lerArquivo(arquivo)
                }}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />

              {lendo ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Lendo planilha...
                </p>
              ) : null}

              {erro ? (
                <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {erro}
                </p>
              ) : null}

              {previa ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">A importar</p>
                      <p className="text-lg font-bold">{previa.novas.length}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-red-700">{moeda(totalNovas)}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Já existem (ignoradas)</p>
                      <p className="text-lg font-bold">{previa.duplicadas.length}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Com erro</p>
                      <p className="text-lg font-bold">{previa.erros.length}</p>
                    </div>
                  </div>

                  {categoriasNovas.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Categorias que serão criadas: <strong>{categoriasNovas.join(", ")}</strong>.
                    </p>
                  ) : null}

                  {previa.erros.length > 0 ? (
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                      <p className="mb-1 font-medium">Linhas que não serão importadas:</p>
                      <ul className="max-h-24 list-disc space-y-0.5 overflow-y-auto pl-5">
                        {previa.erros.map((e) => (
                          <li key={e.linhaPlanilha}>Linha {e.linhaPlanilha}: {e.mensagem}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {previa.novas.length > 0 ? (
                    <div className="max-h-64 overflow-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted text-left text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2">Data</th>
                            <th className="px-3 py-2">Descrição</th>
                            <th className="px-3 py-2">Categoria</th>
                            <th className="px-3 py-2 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previa.novas.map((l) => (
                            <tr key={l.linhaPlanilha} className="border-t">
                              <td className="whitespace-nowrap px-3 py-1.5">{dataBr(l.dataPagamento)}</td>
                              <td className="px-3 py-1.5">{l.descricao}</td>
                              <td className="whitespace-nowrap px-3 py-1.5">{l.categoria}</td>
                              <td className="whitespace-nowrap px-3 py-1.5 text-right">{moeda(l.valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma despesa nova para importar.</p>
                  )}

                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" /> {resultado.criadas} despesas importadas e já baixadas.
              </p>
              {resultado.categoriasCriadas.length > 0 ? (
                <p className="text-muted-foreground">
                  Categorias criadas: {resultado.categoriasCriadas.map((c) => c.nome).join(", ")}.
                </p>
              ) : null}
            </div>
          )}

          <DialogFooter>
            {resultado ? (
              <Button type="button" onClick={() => setAberto(false)}>Fechar</Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setAberto(false)} disabled={importando}>
                  Cancelar
                </Button>
                <Button type="button" onClick={importar} disabled={importando || !previa || previa.novas.length === 0}>
                  {importando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {importando ? progresso || "Importando..." : `Confirmar importação de ${previa?.novas.length || 0} despesas`}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

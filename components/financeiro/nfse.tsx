"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, Loader2, Lock, RefreshCw, Search, Settings, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { calcularNfse, hojeSaoPaulo, resolverDataEfetiva, rotuloStatusAsaas, validarEntradaNfse } from "@/lib/nfse-calculos"
import { listClientesSupabase, type ClienteInput } from "@/lib/supabase/clientes-repo"
import type { FinanceiroCategoriaItem } from "@/lib/supabase/financeiro-repo"
import {
  buscarServicosParaNfseSupabase,
  emitirNfseSupabase,
  getNfseConfigSupabase,
  listNotasFiscaisSupabase,
  getContaAsaasFiscalSupabase,
  salvarNfseConfigSupabase,
  type ContaAsaasFiscal,
  sincronizarNfseSupabase,
  type NfseConfig,
  type NotaFiscalItem,
  type ServicoParaNfse,
} from "@/lib/supabase/nfse-repo"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)
}

function formatDate(value: string) {
  if (!value) return "-"
  const [a, m, d] = value.slice(0, 10).split("-")
  return d ? `${d}/${m}/${a}` : value
}

function toNumber(value: string) {
  const s = String(value || "0").replace(/[^\d,.-]/g, "")
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", ".")) || 0
  return Number(s) || 0
}

function pctTexto(v: number) {
  return String(v ?? 0).replace(".", ",")
}

const LABEL = "text-xs font-semibold uppercase tracking-wide text-muted-foreground"

function StatusNota({ nota }: { nota: NotaFiscalItem }) {
  if (nota.asaasStatus === "AUTHORIZED") return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100"><CheckCircle2 className="h-3 w-3 mr-1" />Autorizada</Badge>
  if (nota.asaasStatus === "ERROR" || nota.asaasStatus === "FALHA_ENVIO") return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100"><AlertCircle className="h-3 w-3 mr-1" />{rotuloStatusAsaas(nota.asaasStatus)}</Badge>
  if (nota.asaasStatus === "CANCELED") return <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">Cancelada</Badge>
  return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"><Clock className="h-3 w-3 mr-1" />{rotuloStatusAsaas(nota.asaasStatus)}</Badge>
}

type Form = {
  chave: string
  origem: "os" | "avulsa"
  servico: ServicoParaNfse | null
  cliente: { id: string; nome: string } | null
  categoriaId: string
  descricao: string
  valor: string
  deducoes: string
  issRetido: boolean
  issAliquota: string
  reterInss: boolean
  inssAliquota: string
  reterIr: boolean
  irAliquota: string
  observacoes: string
  modo: "agora" | "agendar"
  dataAgendada: string
}

function novoForm(config: NfseConfig | null): Form {
  return {
    chave: crypto.randomUUID(),
    origem: "os",
    servico: null,
    cliente: null,
    categoriaId: "",
    descricao: config?.descricaoPadrao || "",
    valor: "",
    deducoes: "",
    issRetido: config?.issRetido ?? false,
    issAliquota: pctTexto(config?.issAliquota ?? 0),
    reterInss: (config?.inssAliquota ?? 0) > 0,
    inssAliquota: pctTexto(config?.inssAliquota ?? 0),
    reterIr: (config?.irAliquota ?? 0) > 0,
    irAliquota: pctTexto(config?.irAliquota ?? 0),
    observacoes: config?.observacoesPadrao || "",
    modo: "agora",
    dataAgendada: "",
  }
}

export function NfseSection({
  categoriasReceita,
  onErro,
  onAviso,
  onAbrirConfig,
}: {
  categoriasReceita: FinanceiroCategoriaItem[]
  onErro: (mensagem: string) => void
  onAviso: (mensagem: string) => void
  onAbrirConfig: () => void
}) {
  const [config, setConfig] = useState<NfseConfig | null>(null)
  const [notas, setNotas] = useState<NotaFiscalItem[]>([])
  const [form, setForm] = useState<Form>(() => novoForm(null))
  const [enviando, setEnviando] = useState(false)
  const [sincronizando, setSincronizando] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [resultadosOs, setResultadosOs] = useState<ServicoParaNfse[]>([])
  const [resultadosClientes, setResultadosClientes] = useState<ClienteInput[]>([])
  const [buscando, setBuscando] = useState(false)

  const recarregarNotas = async () => {
    try {
      setNotas(await listNotasFiscaisSupabase())
    } catch (error) {
      onErro(error instanceof Error ? error.message : "Falha ao carregar notas.")
    }
  }

  useEffect(() => {
    getNfseConfigSupabase()
      .then((cfg) => {
        setConfig(cfg)
        setForm(novoForm(cfg))
      })
      .catch((error) => onErro(error instanceof Error ? error.message : "Falha ao carregar a configuracao fiscal."))
    void recarregarNotas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Busca de OS ou cliente conforme a origem.
  useEffect(() => {
    const termo = busca.trim()
    if (termo.length < 2) {
      setResultadosOs([])
      setResultadosClientes([])
      return
    }
    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        if (form.origem === "os") setResultadosOs(await buscarServicosParaNfseSupabase(termo))
        else setResultadosClientes((await listClientesSupabase({ pageSize: 8, search: termo })).data || [])
      } catch (error) {
        onErro(error instanceof Error ? error.message : "Falha na busca.")
      } finally {
        setBuscando(false)
      }
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, form.origem])

  const entrada = {
    valor: toNumber(form.valor),
    deducoes: toNumber(form.deducoes),
    issAliquota: toNumber(form.issAliquota),
    issRetido: form.issRetido,
    inssAliquota: form.reterInss ? toNumber(form.inssAliquota) : 0,
    irAliquota: form.reterIr ? toNumber(form.irAliquota) : 0,
  }
  const calculo = useMemo(() => calcularNfse(entrada), [JSON.stringify(entrada)]) // eslint-disable-line react-hooks/exhaustive-deps
  const hoje = hojeSaoPaulo()
  const configIncompleta = !config?.municipalServiceId && !config?.municipalServiceCode

  const escolherOs = (os: ServicoParaNfse) => {
    setForm((prev) => ({
      ...prev,
      servico: os,
      cliente: os.clienteId ? { id: os.clienteId, nome: os.clienteNome } : null,
      descricao: prev.descricao || `${os.servico} - ${os.osNumber}`,
      valor: os.valorCobranca > 0 ? String(os.valorCobranca).replace(".", ",") : prev.valor,
    }))
    setBusca("")
    setResultadosOs([])
  }

  const escolherCliente = (c: ClienteInput) => {
    setForm((prev) => ({ ...prev, cliente: { id: String(c.id), nome: c.nome } }))
    setBusca("")
    setResultadosClientes([])
  }

  const emitir = async () => {
    if (enviando) return
    if (configIncompleta) return onErro("Configure o servico municipal em Config. NFS-e antes de emitir.")
    if (form.origem === "os" && !form.servico) return onErro("Selecione a OS.")
    if (!form.cliente) return onErro(form.origem === "os" ? "A OS selecionada nao tem cliente vinculado." : "Selecione o cliente.")
    if (!form.descricao.trim()) return onErro("Informe a descricao do servico.")
    const erroEntrada = validarEntradaNfse(entrada)
    if (erroEntrada) return onErro(erroEntrada)
    const { erro: erroData } = resolverDataEfetiva(form.modo, form.dataAgendada, hoje)
    if (erroData) return onErro(erroData)

    const resumo = form.modo === "agora" ? "emitir agora" : `agendar para ${formatDate(form.dataAgendada)}`
    if (!window.confirm(`Confirmar NFS-e de ${formatCurrency(calculo.valor)} para ${form.cliente.nome} (${resumo})?`)) return

    setEnviando(true)
    try {
      await emitirNfseSupabase({
        chave: form.chave,
        servicoId: form.origem === "os" ? form.servico?.id : undefined,
        clienteId: form.cliente.id,
        categoriaId: form.categoriaId || undefined,
        descricao: form.descricao.trim(),
        observacoes: form.observacoes.trim(),
        valor: entrada.valor,
        deducoes: entrada.deducoes,
        issRetido: entrada.issRetido,
        issAliquota: entrada.issAliquota,
        inssAliquota: entrada.inssAliquota,
        irAliquota: entrada.irAliquota,
        modo: form.modo,
        dataAgendada: form.modo === "agendar" ? form.dataAgendada : undefined,
      })
      setForm(novoForm(config))
      onAviso(
        form.modo === "agora"
          ? "Nota enviada ao Asaas. Ela so conta como emitida quando a prefeitura autorizar — acompanhe o status abaixo."
          : "Nota agendada no Asaas.",
      )
    } catch (error) {
      onErro(error instanceof Error ? error.message : "Falha ao emitir a nota.")
      // O documento pode ter sido criado (falha no envio): a chave e mantida para "Reenviar" sem duplicar.
    } finally {
      setEnviando(false)
      await recarregarNotas()
    }
  }

  const sincronizar = async (nota: NotaFiscalItem) => {
    setSincronizando(nota.id)
    try {
      await sincronizarNfseSupabase(nota.id)
      await recarregarNotas()
    } catch (error) {
      onErro(error instanceof Error ? error.message : "Falha ao atualizar o status.")
    } finally {
      setSincronizando(null)
    }
  }

  const reenviar = async (nota: NotaFiscalItem) => {
    if (!window.confirm("Reenviar esta nota ao Asaas? O sistema confere antes se ela ja foi criada, para nao duplicar.")) return
    setSincronizando(nota.id)
    try {
      await emitirNfseSupabase({
        chave: nota.chave, clienteId: nota.clienteId, descricao: nota.descricao, valor: nota.valor, deducoes: nota.deducoes,
        issRetido: nota.issRetido, issAliquota: 0, inssAliquota: 0, irAliquota: 0, modo: (nota.emissaoModo as "agora" | "agendar") || "agora",
      })
      onAviso("Nota reenviada ao Asaas.")
    } catch (error) {
      onErro(error instanceof Error ? error.message : "Falha ao reenviar.")
    } finally {
      setSincronizando(null)
      await recarregarNotas()
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Emissao de NFS-e</h1>
            <p className="text-sm text-muted-foreground">Nota fiscal de servico pelo Asaas, a partir de uma OS ou avulsa.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onAbrirConfig}>
          <Settings className="h-4 w-4" />Config. NFS-e
        </Button>
      </div>

      {configIncompleta ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Falta configurar o servico municipal e os padroes tributarios. Abra Config. NFS-e (somente o aprovador do financeiro altera).
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Dados da nota</CardTitle>
          <CardDescription>
            Servico municipal: {config?.municipalServiceName || config?.municipalServiceCode || "nao configurado"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-2 max-w-md">
            {([["os", "A partir de uma OS"], ["avulsa", "Nota avulsa"]] as const).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => { setForm((prev) => ({ ...prev, origem: valor, servico: null, cliente: null })); setBusca("") }}
                className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold ${form.origem === valor ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-muted/40 text-muted-foreground"}`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label className={LABEL}>{form.origem === "os" ? "OS" : "Cliente"}</Label>
            {(form.origem === "os" ? form.servico : form.cliente) ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-primary/5 border-primary/30">
                <span className="flex-1 text-sm font-medium text-primary">
                  {form.origem === "os" && form.servico
                    ? `${form.servico.osNumber} · ${form.servico.clienteNome} · ${form.servico.servico}`
                    : form.cliente?.nome}
                </span>
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, servico: null, cliente: null }))} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9"
                  placeholder={form.origem === "os" ? "Numero da OS ou nome do cliente..." : "Nome, CPF ou CNPJ do cliente..."}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  autoComplete="off"
                />
                {buscando ? <Loader2 className="h-4 w-4 absolute right-3 top-2.5 animate-spin text-muted-foreground" /> : null}
                {(form.origem === "os" ? resultadosOs.length : resultadosClientes.length) > 0 ? (
                  <div className="absolute z-20 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {form.origem === "os"
                      ? resultadosOs.map((os) => (
                          <button key={os.id} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted/60 border-b last:border-0" onMouseDown={(e) => { e.preventDefault(); escolherOs(os) }}>
                            <span className="font-medium">{os.osNumber}</span> · {os.clienteNome}
                            <span className="block text-xs text-muted-foreground">{os.servico} · {formatDate(os.data)}{os.valorCobranca ? ` · ${formatCurrency(os.valorCobranca)}` : ""}</span>
                          </button>
                        ))
                      : resultadosClientes.map((c) => (
                          <button key={String(c.id)} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted/60 border-b last:border-0" onMouseDown={(e) => { e.preventDefault(); escolherCliente(c) }}>
                            <span className="font-medium">{c.nome}</span>
                            <span className="block text-xs text-muted-foreground">{c.cnpj || c.cpf || "sem CPF/CNPJ"}</span>
                          </button>
                        ))}
                  </div>
                ) : null}
              </div>
            )}
            {form.origem === "os" ? (
              <p className="text-xs text-muted-foreground">A nota usa a receita ja existente da OS; se a OS nao tiver receita, uma receita programada e criada.</p>
            ) : (
              <p className="text-xs text-muted-foreground">Nota avulsa cria uma receita programada no financeiro.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className={LABEL}>Descricao do servico</Label>
              <Input value={form.descricao} onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className={LABEL}>Categoria (receita nova)</Label>
              <Select value={form.categoriaId || "__none__"} onValueChange={(v) => setForm((prev) => ({ ...prev, categoriaId: v === "__none__" ? "" : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem categoria</SelectItem>
                  {categoriasReceita.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className={LABEL}>Valor da nota</Label>
              <Input value={form.valor} onChange={(e) => setForm((prev) => ({ ...prev, valor: e.target.value }))} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label className={LABEL}>Deducoes</Label>
              <Input value={form.deducoes} onChange={(e) => setForm((prev) => ({ ...prev, deducoes: e.target.value }))} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label className={LABEL}>Aliquota ISS (%)</Label>
              <Input value={form.issAliquota} onChange={(e) => setForm((prev) => ({ ...prev, issAliquota: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className={LABEL}>Responsavel pelo ISS</Label>
              <Select value={form.issRetido ? "tomador" : "prestador"} onValueChange={(v) => setForm((prev) => ({ ...prev, issRetido: v === "tomador" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prestador">Prestador (nos)</SelectItem>
                  <SelectItem value="tomador">Tomador (retido pelo cliente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              ["reterInss", "inssAliquota", "Reter INSS", calculo.valorInss],
              ["reterIr", "irAliquota", "Reter IR", calculo.valorIr],
            ] as const).map(([flag, campo, rotulo, valorCalc]) => (
              <div key={flag} className="flex items-center gap-3 rounded-lg border p-3">
                <Switch checked={form[flag]} onCheckedChange={(v) => setForm((prev) => ({ ...prev, [flag]: v }))} />
                <span className="text-sm font-medium w-24">{rotulo}</span>
                <Input className="h-8 w-20" disabled={!form[flag]} value={form[campo]} onChange={(e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }))} />
                <span className="text-xs text-muted-foreground">%</span>
                <span className="ml-auto text-sm font-semibold">{form[flag] ? formatCurrency(valorCalc) : "—"}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className={LABEL}>Observacoes</Label>
            <Textarea rows={2} value={form.observacoes} onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))} />
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label className={LABEL}>Emissao</Label>
              <div className="grid grid-cols-2 gap-2 w-56">
                {([["agora", "Agora"], ["agendar", "Agendar"]] as const).map(([valor, rotulo]) => (
                  <button key={valor} type="button" onClick={() => setForm((prev) => ({ ...prev, modo: valor }))}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold ${form.modo === valor ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-muted/40 text-muted-foreground"}`}>
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>
            {form.modo === "agendar" ? (
              <div className="space-y-2">
                <Label className={LABEL}>Data</Label>
                <Input type="date" min={hoje} value={form.dataAgendada} onChange={(e) => setForm((prev) => ({ ...prev, dataAgendada: e.target.value }))} />
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 text-sm grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
            <div className="flex justify-between"><span>Valor bruto da nota</span><strong>{formatCurrency(calculo.valor)}</strong></div>
            <div className="flex justify-between"><span>Base do ISS</span><span>{formatCurrency(calculo.baseIss)}</span></div>
            <div className="flex justify-between"><span>ISS ({form.issRetido ? "retido" : "a recolher"})</span><span>{formatCurrency(calculo.valorIss)}</span></div>
            <div className="flex justify-between"><span>Retencoes</span><span className="text-red-700">- {formatCurrency(calculo.totalRetencoes)}</span></div>
            <div className="flex justify-between font-semibold md:col-span-2"><span>Liquido a receber</span><span className="text-green-700">{formatCurrency(calculo.liquidoReceber)}</span></div>
          </div>

          <Button className="w-full h-11 font-semibold" onClick={() => void emitir()} disabled={enviando || configIncompleta}>
            {enviando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {form.modo === "agora" ? "Emitir NFS-e" : "Agendar NFS-e"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Notas fiscais</CardTitle>
            <CardDescription>So "Autorizada" significa nota emitida pela prefeitura.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void recarregarNotas()}><RefreshCw className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-6">Cliente</TableHead>
                <TableHead>Numero</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Bruto / liquido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Nenhuma nota registrada.</TableCell></TableRow>
              ) : (
                notas.map((nota) => (
                  <TableRow key={nota.id}>
                    <TableCell className="pl-6 font-medium">{nota.clienteNome || "-"}{nota.servicoNumero ? <span className="block text-xs text-muted-foreground">{nota.servicoNumero}</span> : null}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {nota.numero || "—"}
                      {nota.codigoVerificacao ? <span className="block text-xs text-muted-foreground font-sans">Verif. {nota.codigoVerificacao}</span> : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate">{nota.descricao}</TableCell>
                    <TableCell className="text-sm">{formatDate(nota.dataEfetiva)}{nota.emissaoModo === "agendar" ? <span className="block text-xs text-muted-foreground">agendada</span> : null}</TableCell>
                    <TableCell className="text-right text-sm">
                      <span className="font-semibold">{formatCurrency(nota.valor)}</span>
                      <span className="block text-xs text-muted-foreground">{formatCurrency(nota.valorLiquidoReceber)}</span>
                    </TableCell>
                    <TableCell>
                      <StatusNota nota={nota} />
                      {nota.erroMotivo ? <p className="text-xs text-red-600 mt-1 max-w-[260px]">{nota.erroMotivo}</p> : null}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        {nota.pdfUrl ? <a href={nota.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline">PDF<ExternalLink className="h-3 w-3" /></a> : null}
                        {nota.xmlUrl ? <a href={nota.xmlUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline ml-2">XML<ExternalLink className="h-3 w-3" /></a> : null}
                        {nota.asaasStatus === "FALHA_ENVIO" && !nota.asaasInvoiceId ? (
                          <Button variant="outline" size="sm" className="h-7 text-xs ml-2" disabled={sincronizando === nota.id} onClick={() => void reenviar(nota)}>Reenviar</Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-7 text-xs ml-1" disabled={sincronizando === nota.id} onClick={() => void sincronizar(nota)}>
                            {sincronizando === nota.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

export function NfseConfigSection({
  isAprovador,
  onErro,
  onAviso,
}: {
  isAprovador: boolean
  onErro: (mensagem: string) => void
  onAviso: (mensagem: string) => void
}) {
  const [config, setConfig] = useState<NfseConfig | null>(null)
  const [textos, setTextos] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [conta, setConta] = useState<ContaAsaasFiscal | null>(null)
  const [erroConta, setErroConta] = useState("")

  useEffect(() => {
    getContaAsaasFiscalSupabase()
      .then(setConta)
      .catch((error) => setErroConta(error instanceof Error ? error.message : "Nao foi possivel consultar o Asaas."))
  }, [])

  // Importa do Asaas o que a conta tiver (item da lista de servicos) sem sobrescrever o que ja foi digitado.
  useEffect(() => {
    if (!conta || !config) return
    setConfig((prev) => {
      if (!prev) return prev
      const proximo = { ...prev }
      if (!proximo.municipalServiceCode && conta.itemListaServico) proximo.municipalServiceCode = conta.itemListaServico
      if (conta.portalNacional) proximo.municipalServiceId = ""
      return proximo
    })
    if (conta.simplesNacional) {
      setTextos((prev) => ({ ...prev, pisAliquota: prev.pisAliquota || "0", cofinsAliquota: prev.cofinsAliquota || "0", csllAliquota: prev.csllAliquota || "0" }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conta, Boolean(config)])

  useEffect(() => {
    getNfseConfigSupabase()
      .then((cfg) => {
        setConfig(cfg)
        setTextos({
          issAliquota: pctTexto(cfg.issAliquota), inssAliquota: pctTexto(cfg.inssAliquota), irAliquota: pctTexto(cfg.irAliquota),
          pisAliquota: pctTexto(cfg.pisAliquota), cofinsAliquota: pctTexto(cfg.cofinsAliquota), csllAliquota: pctTexto(cfg.csllAliquota),
        })
      })
      .catch((error) => onErro(error instanceof Error ? error.message : "Falha ao carregar a configuracao."))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!config) return <p className="text-sm text-muted-foreground">Carregando configuracao...</p>

  const setCampo = (campo: keyof NfseConfig, valor: string | boolean) => setConfig((prev) => (prev ? { ...prev, [campo]: valor } : prev))

  const salvar = async () => {
    if (!config.municipalServiceId.trim() && !config.municipalServiceCode.trim()) return onErro("Informe o ID ou o codigo do servico municipal.")
    const aliquotas = Object.fromEntries(Object.entries(textos).map(([k, v]) => [k, toNumber(v)]))
    if (Object.values(aliquotas).some((v) => v < 0 || v >= 100)) return onErro("Aliquotas devem ficar entre 0 e 99,99.")
    if (!window.confirm("Salvar a configuracao fiscal? Ela vale para as proximas notas.")) return
    setSalvando(true)
    try {
      await salvarNfseConfigSupabase({ ...config, ...(aliquotas as Partial<NfseConfig>) })
      onAviso("Configuracao fiscal salva.")
    } catch (error) {
      onErro(error instanceof Error ? error.message : "Falha ao salvar.")
    } finally {
      setSalvando(false)
    }
  }

  const ro = !isAprovador

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2"><Settings className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuracao da NFS-e</h1>
          <p className="text-sm text-muted-foreground">Servico municipal e padroes tributarios usados nas notas. Confira os valores com a contabilidade.</p>
        </div>
      </div>
      {ro ? (
        <p className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />Somente o aprovador do financeiro pode alterar.
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Inscricao municipal, regime tributario, certificado digital e acesso a prefeitura ficam no painel do Asaas (Notas fiscais &gt; Configuracoes), nao aqui.
      </p>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conta no Asaas</CardTitle>
          <CardDescription>Lido da API do Asaas (somente leitura).</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {erroConta ? <p className="text-red-600">{erroConta}</p> : null}
          {!conta && !erroConta ? <p className="text-muted-foreground">Consultando...</p> : null}
          {conta ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1">
              <span>Ambiente: <strong>{conta.ambiente === "producao" ? "Producao" : "Sandbox"}</strong></span>
              <span>Regime: <strong>{conta.simplesNacional ? "Simples Nacional" : "Regime normal"}</strong></span>
              <span>Emissao: <strong>{conta.portalNacional ? "Portal Nacional" : "Prefeitura"}</strong></span>
              <span>Certificado: <strong className={conta.certificadoEnviado ? "text-green-700" : "text-red-600"}>{conta.certificadoEnviado ? "enviado" : "nao enviado"}</strong></span>
              <span>CNAE: <strong>{conta.cnae || "-"}</strong></span>
              <span className="md:col-span-3">Servico padrao no Asaas: <strong>{conta.itemListaServico || "nao definido na API"}</strong></span>
            </div>
          ) : null}
          {conta && !conta.itemListaServico ? (
            <p className="text-xs text-amber-700 mt-2">
              O Asaas nao devolve um servico padrao pela API, e toda nota enviada pela API precisa do codigo do servico e das aliquotas. Preencha abaixo com os mesmos dados do painel do Asaas.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Servico municipal</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {conta?.portalNacional ? (
            <p className="text-xs text-muted-foreground self-end pb-2">Portal Nacional: usa apenas o codigo do servico (item da lista da LC 116, ex.: 7.13).</p>
          ) : (
            <div className="space-y-2">
              <Label className={LABEL}>ID do servico no Asaas</Label>
              <Input disabled={ro} value={config.municipalServiceId} onChange={(e) => setCampo("municipalServiceId", e.target.value)} placeholder="Se a prefeitura tiver lista" />
            </div>
          )}
          <div className="space-y-2">
            <Label className={LABEL}>Codigo do servico</Label>
            <Input disabled={ro} value={config.municipalServiceCode} onChange={(e) => setCampo("municipalServiceCode", e.target.value)} placeholder="Ex: 7.13" />
          </div>
          <div className="space-y-2">
            <Label className={LABEL}>Nome do servico</Label>
            <Input disabled={ro} value={config.municipalServiceName} onChange={(e) => setCampo("municipalServiceName", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label className={LABEL}>Descricao padrao da nota</Label>
            <Input disabled={ro} value={config.descricaoPadrao} onChange={(e) => setCampo("descricaoPadrao", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label className={LABEL}>Observacoes padrao</Label>
            <Textarea disabled={ro} rows={2} value={config.observacoesPadrao} onChange={(e) => setCampo("observacoesPadrao", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Padroes tributarios (%)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {([["issAliquota", "ISS"], ["inssAliquota", "INSS"], ["irAliquota", "IR"], ["pisAliquota", "PIS"], ["cofinsAliquota", "COFINS"], ["csllAliquota", "CSLL"]] as const).map(([campo, rotulo]) => (
              <div key={campo} className="space-y-2">
                <Label className={LABEL}>{rotulo}</Label>
                <Input disabled={ro} value={textos[campo] || ""} onChange={(e) => setTextos((prev) => ({ ...prev, [campo]: e.target.value }))} />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-3">
            <Switch disabled={ro} checked={config.issRetido} onCheckedChange={(v) => setCampo("issRetido", v)} />
            <span className="text-sm">ISS retido pelo tomador por padrao</span>
          </label>
          <p className="text-xs text-muted-foreground">INSS e IR entram como retencao na nota quando marcados na emissao. PIS, COFINS e CSLL sao enviados ao Asaas como informados aqui.</p>
          {config.atualizadoPorNome ? (
            <p className="text-xs text-muted-foreground">Ultima alteracao: {config.atualizadoPorNome} em {new Date(config.updatedAt).toLocaleString("pt-BR")}</p>
          ) : null}
          {!ro ? (
            <Button onClick={() => void salvar()} disabled={salvando}>
              {salvando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Salvar configuracao
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </>
  )
}

"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import {
  ChevronRight,
  FileText,
  User,
  Calendar,
  DollarSign,
  ClipboardList,
  Plus,
  Trash2,
  Upload,
  Save,
  X,
  Building2,
  Search,
  Printer,
} from "lucide-react"
import Link from "next/link"
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog"
import { listClientesSupabase, upsertClienteSupabase, type ClienteInput } from "@/lib/supabase/clientes-repo"
import { mapClienteToResumoView } from "@/lib/supabase/clientes-view"
import { upsertFlowContrato, type FlowContrato } from "@/lib/flow-store"
import { addClienteArquivoContratoSupabase, listContratosSupabase, upsertContratoSupabase } from "@/lib/supabase/contratos-repo"

interface ServicoContrato {
  id: string
  tipoServico: string
  frequencia: string
  limites: string
}

interface Cliente {
  id: string
  nome: string
  cpfCnpj: string
  tipo: "PF" | "PJ"
  status: string
  telefone: string
  email: string
}


declare global {
  interface Window {
    PizZip?: any
    docxtemplater?: any
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; details?: unknown }
    if (typeof maybeError.message === "string") return maybeError.message
    if (typeof maybeError.details === "string") return maybeError.details
  }
  return "Ocorreu um erro inesperado."
}
// Mock de clientes cadastrados
const clientesCadastrados: Cliente[] = [
  { id: "1", nome: "Empresa ABC Ltda", cpfCnpj: "12.345.678/0001-90", tipo: "PJ", status: "Ativo", telefone: "(11) 99999-9999", email: "contato@empresaabc.com.br" },
  { id: "2", nome: "João Silva", cpfCnpj: "123.456.789-00", tipo: "PF", status: "Ativo", telefone: "(11) 98888-8888", email: "joao@email.com" },
  { id: "3", nome: "Comércio XYZ ME", cpfCnpj: "98.765.432/0001-10", tipo: "PJ", status: "Ativo", telefone: "(11) 97777-7777", email: "xyz@comercio.com.br" },
  { id: "4", nome: "Maria Santos", cpfCnpj: "987.654.321-00", tipo: "PF", status: "Ativo", telefone: "(11) 96666-6666", email: "maria@email.com" },
  { id: "5", nome: "Indústria Beta S.A.", cpfCnpj: "11.222.333/0001-44", tipo: "PJ", status: "Ativo", telefone: "(11) 95555-5555", email: "beta@industria.com.br" },
]

export default function NovoContratoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get("clienteId")

  // Estado para seleção de cliente
  const [searchTerm, setSearchTerm] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [clientesDisponiveis, setClientesDisponiveis] = useState<Cliente[]>([])
  const [clientesCompletos, setClientesCompletos] = useState<ClienteInput[]>([])
  const [showClienteList, setShowClienteList] = useState(false)
  const [pageError, setPageError] = useState("")
  const [isSavingContrato, setIsSavingContrato] = useState(false)
  const [confirmContrato, setConfirmContrato] = useState<{
    open: boolean
    afterSave: "listar" | "servico" | null
  }>({ open: false, afterSave: null })

  useEffect(() => {
    let mounted = true

    const loadClientes = async () => {
      try {
        const result = await listClientesSupabase({ pageSize: 9999 })
        const rows = result.data
        if (!mounted) return
        setClientesCompletos(rows)
        setClientesDisponiveis(rows.map(mapClienteToResumoView))
      } catch (error) {
        console.error("Falha ao carregar clientes para contratos", error)
        if (mounted) {
          setClientesCompletos([])
          setClientesDisponiveis([])
        }
      }
    }

    void loadClientes()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!clienteIdParam) return
    const selected = clientesDisponiveis.find((c) => c.id === clienteIdParam) || null
    setClienteSelecionado(selected)
  }, [clienteIdParam, clientesDisponiveis])

  const clientesFiltrados = clientesDisponiveis.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpfCnpj.includes(searchTerm) ||
    cliente.telefone.includes(searchTerm)
  )

  // Estado do formulário
  const [tipoContrato, setTipoContrato] = useState("recorrente")
  const [statusContrato, setStatusContrato] = useState("ativo")
  const [dataInicio, setDataInicio] = useState("")
  const [dataTermino, setDataTermino] = useState("")
  const [diaVencimento, setDiaVencimento] = useState("")
  const [valorMensal, setValorMensal] = useState("")
  const [reajusteAnual, setReajusteAnual] = useState("")
  const [multaContratual, setMultaContratual] = useState("")
  const [exigeAprovacao, setExigeAprovacao] = useState(false)
  const [adicionalDescricao, setAdicionalDescricao] = useState("")
  const [observacoesContratuais, setObservacoesContratuais] = useState("")
  const [observacoesInternas, setObservacoesInternas] = useState("")
  const [arquivoContrato, setArquivoContrato] = useState<File | null>(null)

  // Serviços inclusos
  const [servicosContrato, setServicosContrato] = useState<ServicoContrato[]>([
    { id: "1", tipoServico: "", frequencia: "", limites: "" }
  ])

  const tiposServico = [
    "Controle de Pragas",
    "Limpeza de Caixa d'Água",
    "Desentupimento",
    "Sanitização",
    "Desratização",
    "Descupinização",
    "Limpeza de Fossa",
    "Higienização de Ar-Condicionado"
  ]

  const frequencias = [
    { value: "mensal", label: "Mensal" },
    { value: "bimestral", label: "Bimestral" },
    { value: "trimestral", label: "Trimestral" },
    { value: "semestral", label: "Semestral" },
    { value: "anual", label: "Anual" }
  ]

  const adicionarServico = () => {
    setServicosContrato([
      ...servicosContrato,
      { id: Date.now().toString(), tipoServico: "", frequencia: "", limites: "" }
    ])
  }

  const removerServico = (id: string) => {
    if (servicosContrato.length > 1) {
      setServicosContrato(servicosContrato.filter(s => s.id !== id))
    }
  }

  const atualizarServico = (id: string, campo: keyof ServicoContrato, valor: string) => {
    setServicosContrato(servicosContrato.map(s => 
      s.id === id ? { ...s, [campo]: valor } : s
    ))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivoContrato(e.target.files[0])
    }
  }

  const toBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = String(reader.result || "")
        const base64 = result.includes(",") ? result.split(",")[1] : ""
        resolve(base64)
      }
      reader.onerror = () => reject(new Error("Falha ao processar arquivo"))
      reader.readAsDataURL(blob)
    })

  const ensureScript = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve()
          return
        }
        existing.addEventListener("load", () => resolve(), { once: true })
        existing.addEventListener("error", () => reject(new Error(`Falha ao carregar ${src}`)), { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = src
      script.async = true
      script.onload = () => {
        script.dataset.loaded = "true"
        resolve()
      }
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`))
      document.head.appendChild(script)
    })

  const ensureDocxLibs = async () => {
    if (typeof window === "undefined") throw new Error("Ambiente sem navegador")

    if (!window.PizZip) {
      await ensureScript("https://cdn.jsdelivr.net/npm/pizzip@3.2.0/dist/pizzip.min.js")
    }

    if (!window.docxtemplater) {
      await ensureScript("https://cdn.jsdelivr.net/npm/docxtemplater@3.67.5/build/docxtemplater.js")
    }

    if (!window.PizZip || !window.docxtemplater) {
      throw new Error("Bibliotecas de template DOCX indisponiveis")
    }
  }

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;")

  const formatarDataBR = (isoDate: string) => {
    if (!isoDate) return "-"
    const [y, m, d] = isoDate.split("-")
    if (!y || !m || !d) return isoDate
    return `${d}/${m}/${y}`
  }

  const normalizeTemplateKey = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase()

  const gerarDocumentoContratoFallback = (params: {
    numeroContrato: string
    cliente: Cliente
    itens: Array<{ nome: string; frequencia?: string; limites?: string }>
  }) => {
    const linhasServicos = params.itens
      .map((item, index) => {
        const freq = item.frequencia ? ` | Frequencia: ${item.frequencia}` : ""
        const limite = item.limites ? ` | Limites: ${item.limites}` : ""
        return `<li>${index + 1}. ${escapeHtml(item.nome)}${escapeHtml(freq)}${escapeHtml(limite)}</li>`
      })
      .join("")

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(params.numeroContrato)}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; color: #111; font-size: 12pt; line-height: 1.5; margin: 30px; }
    h1 { font-size: 15pt; margin: 0 0 12px; text-transform: uppercase; }
    h2 { font-size: 12pt; margin: 20px 0 8px; }
    p { margin: 0 0 8px; }
    .box { border: 1px solid #ddd; padding: 10px; margin: 14px 0; }
  </style>
</head>
<body>
  <h1>Contrato de Prestacao de Servicos</h1>
  <p><strong>Modelo base:</strong> Labormed 17.12 (Higiene Disque)</p>
  <p><strong>Numero do contrato:</strong> ${escapeHtml(params.numeroContrato)}</p>
  <p><strong>Data de inicio:</strong> ${escapeHtml(formatarDataBR(dataInicio))}</p>
  <p><strong>Data de termino:</strong> ${escapeHtml(formatarDataBR(dataTermino))}</p>
  <div class="box">
    <p><strong>Contratante:</strong> ${escapeHtml(params.cliente.nome)}</p>
    <p><strong>CPF/CNPJ:</strong> ${escapeHtml(params.cliente.cpfCnpj || "-")}</p>
    <p><strong>Telefone:</strong> ${escapeHtml(params.cliente.telefone || "-")}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(params.cliente.email || "-")}</p>
  </div>
  <h2>Servicos incluidos</h2>
  <ol>${linhasServicos}</ol>
  <h2>Condicoes financeiras</h2>
  <p><strong>Valor:</strong> ${escapeHtml(valorMensal || "-")}</p>
  <p><strong>Vencimento:</strong> Dia ${escapeHtml(diaVencimento || "-")}</p>
  <p><strong>Reajuste anual:</strong> ${escapeHtml(reajusteAnual || "-")}</p>
  <p><strong>Multa contratual:</strong> ${escapeHtml(multaContratual || "-")}</p>
  <h2>Regras adicionais</h2>
  <p><strong>Exige aprovacao previa:</strong> ${exigeAprovacao ? "Sim" : "Nao"}</p>
  <p><strong>Descricao de servicos adicionais:</strong> ${escapeHtml(adicionalDescricao || "-")}</p>
  <p><strong>Observacoes contratuais:</strong> ${escapeHtml(observacoesContratuais || "-")}</p>
  <p><strong>Observacoes internas:</strong> ${escapeHtml(observacoesInternas || "-")}</p>
</body>
</html>`
  }

  const gerarDocxDoTemplate = async (data: Record<string, unknown>) => {
    try {
      await ensureDocxLibs()
      const response = await fetch("/templates/contrato-modelo.docx")
      if (!response.ok) throw new Error("Modelo DOCX nao encontrado")

      const arrayBuffer = await response.arrayBuffer()
      const zip = new window.PizZip(arrayBuffer)
      const doc = new window.docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "[", end: "]" },
        nullGetter: () => "",
      })

      doc.render(data)
      return doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }) as Blob
    } catch {
      return null
    }
  }

  const persistirContrato = async () => {
    if (!clienteSelecionado) {
      alert("Selecione um cliente para salvar o contrato.")
      return null
    }

    const itensValidos = servicosContrato
      .filter((s) => s.tipoServico.trim())
      .map((s) => ({ id: s.id, nome: s.tipoServico }))
    const itensDetalhados = servicosContrato
      .filter((s) => s.tipoServico.trim())
      .map((s) => ({ nome: s.tipoServico, frequencia: s.frequencia, limites: s.limites }))

    if (itensValidos.length === 0) {
      alert("Adicione ao menos um servico no contrato.")
      return null
    }

    const contratosExistentes = await listContratosSupabase()
    const ano = new Date().getFullYear()
    const sequencial = String(contratosExistentes.length + 1).padStart(3, "0")

    const clienteCompleto = clientesCompletos.find((cliente) => String(cliente.id) === clienteSelecionado.id)
    if (!clienteCompleto) {
      throw new Error("Cliente selecionado nao foi encontrado para salvar o contrato.")
    }

    const contratoPayload = {
      clienteId: clienteSelecionado.id,
      numero: `CONT-${ano}-${sequencial}`,
      descricao: `${tipoContrato === "recorrente" ? "Contrato Recorrente" : "Contrato Avulso"} - ${itensValidos[0]?.nome || "Servicos"}`,
      status: statusContrato as "ativo" | "suspenso" | "encerrado",
      tipoContrato: tipoContrato as "recorrente" | "avulso",
      dataInicio,
      dataTermino,
      itens: itensValidos,
    }

    const nomeClienteSeguro = clienteSelecionado.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase()

    const enderecoPrincipal = Array.isArray(clienteCompleto?.locais) && clienteCompleto.locais.length > 0
      ? clienteCompleto.locais[0]
      : null

    const clienteEndereco = enderecoPrincipal
      ? [
          enderecoPrincipal.endereco,
          enderecoPrincipal.numero,
          enderecoPrincipal.complemento,
          enderecoPrincipal.bairro,
          enderecoPrincipal.cidade,
          enderecoPrincipal.estado,
          enderecoPrincipal.cep,
        ]
          .filter(Boolean)
          .join(", ")
      : "endereco nao informado"

    const locaisCliente = Array.isArray(clienteCompleto?.locais) ? clienteCompleto.locais : []
    const formatarEnderecoLocal = (local: any) =>
      [
        local?.endereco,
        local?.numero,
        local?.complemento,
        local?.bairro,
        local?.cidade,
        local?.estado,
        local?.cep,
      ]
        .filter(Boolean)
        .join(", ")
    const nomeDoLocal = enderecoPrincipal?.nome || enderecoPrincipal?.tipoAmbiente || "Local principal"

    const dataAssinatura = new Date()
    const dataAssinaturaExtenso = dataAssinatura.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    const valorMensalNormalizado = (valorMensal || "-").replace("R$", "").trim()

    const nomesServicos = [0, 1, 2, 3, 4].map((index) => itensDetalhados[index]?.nome || "-")
    const especificacaoServico = itensDetalhados
      .map((item) => [item.frequencia, item.limites].filter(Boolean).join(" | "))
      .filter(Boolean)
      .join(" ; ") || "-"
    const periodoServico = itensDetalhados
      .map((item) => item.frequencia)
      .filter(Boolean)
      .join(" / ") || "-"
    const periodoMensalOuAnual = tipoContrato === "recorrente" ? "Mensal" : "Anual"
    const inicioDate = dataInicio ? new Date(`${dataInicio}T00:00:00`) : null
    const terminoDate = dataTermino ? new Date(`${dataTermino}T00:00:00`) : null
    const periodoEmMeses =
      inicioDate && terminoDate && !Number.isNaN(inicioDate.getTime()) && !Number.isNaN(terminoDate.getTime())
        ? Math.max(1, (terminoDate.getFullYear() - inicioDate.getFullYear()) * 12 + (terminoDate.getMonth() - inicioDate.getMonth()))
        : "-"

    const servicosListaFormatada = itensDetalhados
      .map((item) => {
        const partes = [item.nome, item.frequencia, item.limites].filter(Boolean)
        return partes.join(" - ")
      })
      .join("\n") || "-"

    const tipoEnderecoFormatado = enderecoPrincipal?.tipoAmbiente || "Local de servico"

    const templateData: Record<string, string> = {
      // ── Variáveis do template TEMPLATE HIGIENE DISQUE_CONTRATO.docx ──
      "EMPRESA CONTRATANTE": clienteCompleto.nome,
      "CNPJ": clienteSelecionado.cpfCnpj || "-",
      "ENDEREÇO": clienteEndereco,
      "NOME DO CLIENTE": clienteSelecionado.nome,
      "Serviços Inclusos no Contrato": servicosListaFormatada,
      "TIPO ENDEREÇO": tipoEnderecoFormatado,
      "Data de Inicio": formatarDataBR(dataInicio),
      "Data de Término/ Renovação": formatarDataBR(dataTermino),
      "VALOR MENSAL": valorMensalNormalizado || "-",
      "DIA DE VENCIMENTO": diaVencimento || "-",
      "Data de Hoje": new Date().toLocaleDateString("pt-BR"),
      // ── Variáveis legadas / extras ──
      "NOME DA EMPRESA": "Higiene Disque",
      "ENDERE\u00C7O COMPLETO": clienteEndereco,
      "NOME DO LOCAL": nomeDoLocal,
      "ENDERE\u00C7O DO LOCAL1": formatarEnderecoLocal(locaisCliente[0]) || "-",
      "ENDERE\u00C7O DO LOCAL2": formatarEnderecoLocal(locaisCliente[1]) || "-",
      "ENDERE\u00C7O DO LOCAL3": formatarEnderecoLocal(locaisCliente[2]) || "-",
      "ENDERE\u00C7O DO LOCAL4": formatarEnderecoLocal(locaisCliente[3]) || "-",
      "NOME DOS SERVI\u00C7OS": itensDetalhados.map((item) => item.nome).join(", ") || "-",
      "NOME DO SERVI\u00C7O 1": nomesServicos[0],
      "NOME DO SERVI\u00C7O 2": nomesServicos[1],
      "NOME DO SERVI\u00C7O 3": nomesServicos[2],
      "NOME DO SERVI\u00C7O 4": nomesServicos[3],
      "NOME DO SERVI\u00C7O 5": nomesServicos[4],
      "PERIODO DO SERVI\u00C7O": periodoServico,
      "(PERIODO EM MESES)": String(periodoEmMeses),
      "Periodo mensal ou Anual": periodoMensalOuAnual,
      VALOR: valorMensalNormalizado || "-",
      "(Valor por extenso)": valorMensalNormalizado || "-",
      "DATA DO VENCIMENTO": diaVencimento || "-",
      "Data Atual": new Date().toLocaleDateString("pt-BR"),
      CONTRATO_NUMERO: contratoPayload.numero,
      CONTRATO_TIPO: tipoContrato === "recorrente" ? "Recorrente" : "Avulso",
      CONTRATO_STATUS: statusContrato,
      DATA_INICIO: formatarDataBR(dataInicio),
      DATA_TERMINO: formatarDataBR(dataTermino),
      CLIENTE_NOME: clienteSelecionado.nome,
      CLIENTE_CPF_CNPJ: clienteSelecionado.cpfCnpj || "-",
      CLIENTE_TELEFONE: clienteSelecionado.telefone || "-",
      CLIENTE_EMAIL: clienteSelecionado.email || "-",
      CLIENTE_ENDERECO: clienteEndereco,
      SERVICOS_LISTA: servicosListaFormatada,
      VALOR_MENSAL: valorMensalNormalizado,
      DIA_VENCIMENTO: diaVencimento || "-",
      REAJUSTE_ANUAL: reajusteAnual || "-",
      MULTA_CONTRATUAL: multaContratual || "-",
      EXIGE_APROVACAO: exigeAprovacao ? "Sim" : "Nao",
      ADICIONAL_DESCRICAO: adicionalDescricao || "-",
      OBSERVACOES_CONTRATUAIS: observacoesContratuais || "-",
      CIDADE_ASSINATURA: enderecoPrincipal?.cidade || "Niteroi",
      DATA_ASSINATURA_EXTENSO: dataAssinaturaExtenso,
      GERADO_EM: new Date().toLocaleDateString("pt-BR"),
    }

    const docxBlob = await gerarDocxDoTemplate(templateData)
    const documentoFallbackHtml = gerarDocumentoContratoFallback({
      numeroContrato: contratoPayload.numero,
      cliente: clienteSelecionado,
      itens: itensDetalhados,
    })

    const arquivoBlob =
      docxBlob || new Blob([documentoFallbackHtml], { type: "application/msword;charset=utf-8" })
    const arquivoNome = docxBlob
      ? `${contratoPayload.numero}-${nomeClienteSeguro || "cliente"}.docx`
      : `${contratoPayload.numero}-${nomeClienteSeguro || "cliente"}.doc`
    const arquivoMime = docxBlob
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/msword"

    const contratoSalvo = await upsertContratoSupabase(contratoPayload)

    let situacaoContrato = clienteCompleto.situacaoContrato || ""
    if (statusContrato === "encerrado") {
      situacaoContrato = "Vencido"
    } else if (statusContrato === "suspenso") {
      situacaoContrato = "A vencer"
    } else if (dataTermino) {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const fim = new Date(`${dataTermino}T00:00:00`)
      const diffDays = Math.floor((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays < 0) situacaoContrato = "Vencido"
      else if (diffDays <= 30) situacaoContrato = "A vencer"
      else situacaoContrato = "Em dia"
    } else {
      situacaoContrato = "Em dia"
    }

    await upsertClienteSupabase({
      ...clienteCompleto,
      possuiContrato: true,
      tipoContrato: tipoContrato === "recorrente" ? "Recorrente" : "Avulso",
      dataInicioContrato: dataInicio || clienteCompleto.dataInicioContrato || "",
      dataFimContrato: dataTermino || clienteCompleto.dataFimContrato || "",
      situacaoContrato,
    })

    await addClienteArquivoContratoSupabase({
      clienteId: clienteSelecionado.id,
      contratoId: contratoSalvo.id,
      nome: arquivoNome,
      mimeType: arquivoMime,
      arquivo: arquivoBlob,
      origem: "contrato-gerado",
    })

    if (arquivoContrato) {
      await addClienteArquivoContratoSupabase({
        clienteId: clienteSelecionado.id,
        contratoId: contratoSalvo.id,
        nome: arquivoContrato.name,
        mimeType: arquivoContrato.type || "application/octet-stream",
        arquivo: arquivoContrato,
        origem: "contrato-assinado",
      })
    }

    const contratoFlow: FlowContrato = {
      id: contratoSalvo.id,
      clienteId: contratoSalvo.clienteId,
      numero: contratoSalvo.numero,
      descricao: contratoSalvo.descricao,
      status: contratoSalvo.status,
      tipoContrato: contratoSalvo.tipoContrato,
      dataInicio: contratoSalvo.dataInicio,
      dataTermino: contratoSalvo.dataTermino,
      itens: contratoSalvo.itens,
    }

    upsertFlowContrato(contratoFlow)
    return contratoFlow
  }
  const handleOpenConfirmContrato = (afterSave: "listar" | "servico") => {
    if (!clienteSelecionado) {
      setPageError("Selecione um cliente antes de salvar o contrato.")
      return
    }
    setConfirmContrato({ open: true, afterSave })
  }

  const handleExecuteSalvarContrato = async () => {
    if (!confirmContrato.afterSave || isSavingContrato) return
    setIsSavingContrato(true)
    try {
      setPageError("")
      const contrato = await persistirContrato()
      if (!contrato) return
      setConfirmContrato({ open: false, afterSave: null })
      if (confirmContrato.afterSave === "servico") {
        alert("Contrato salvo e anexado ao cliente. Redirecionando para cadastro de servico...")
        router.push(`/dashboard/servicos?clienteId=${contrato.clienteId}`)
      } else {
        alert("Contrato salvo com sucesso e anexado ao cliente.")
        router.push(`/dashboard/clientes`)
      }
    } catch (error) {
      console.error("Falha ao salvar contrato", error)
      setPageError(getErrorMessage(error))
    } finally {
      setIsSavingContrato(false)
    }
  }

  // mantido para compatibilidade de chamadas legadas
  const handleSalvar = () => handleOpenConfirmContrato("listar")
  const handleSalvarECadastrarServico = () => handleOpenConfirmContrato("servico")
  const clienteData = clienteSelecionado || { nome: "", cpfCnpj: "", tipo: "", status: "" }

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/clientes" className="hover:text-foreground transition-colors">Clientes</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Detalhes do Cliente</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Novo Contrato</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cadastro de Contrato</h1>
          <p className="text-muted-foreground">Definição de contrato recorrente ou avulso</p>
        </div>

        <div className="space-y-6">
          {pageError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}
          {/* BLOCO 1 ??" Seleção/Identificação do Cliente */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Selecionar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!clienteSelecionado ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome, CPF/CNPJ ou telefone..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowClienteList(true)
                      }}
                      onFocus={() => setShowClienteList(true)}
                      className="pl-10"
                    />
                  </div>
                  
                  {showClienteList && (
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map(cliente => (
                          <button
                            key={cliente.id}
                            type="button"
                            className="w-full p-3 text-left hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                            onClick={() => {
                              setClienteSelecionado(cliente)
                              setShowClienteList(false)
                              setSearchTerm("")
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground">{cliente.nome}</p>
                                <p className="text-sm text-muted-foreground">{cliente.cpfCnpj} | {cliente.telefone}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                cliente.tipo === "PJ" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                              }`}>
                                {cliente.tipo}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="p-3 text-center text-muted-foreground">Nenhum cliente encontrado</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nome / Razão Social</Label>
                      <p className="font-medium text-foreground">{clienteSelecionado.nome}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">CPF/CNPJ</Label>
                      <p className="font-medium text-foreground">{clienteSelecionado.cpfCnpj}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <p className="font-medium text-foreground">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          clienteSelecionado.tipo === "PJ" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        }`}>
                          <Building2 className="h-3 w-3" />
                          {clienteSelecionado.tipo === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status do Cliente</Label>
                      <p className="font-medium">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                          {clienteSelecionado.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClienteSelecionado(null)}
                    className="bg-transparent"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Alterar cliente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BLOCO 2 ??" Tipo de Contrato */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Tipo de Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Tipo</Label>
                  <RadioGroup value={tipoContrato} onValueChange={setTipoContrato} className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recorrente" id="recorrente" />
                      <Label htmlFor="recorrente" className="font-normal cursor-pointer">Recorrente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="avulso" id="avulso" />
                      <Label htmlFor="avulso" className="font-normal cursor-pointer">Avulso</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusContrato} onValueChange={setStatusContrato}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                      <SelectItem value="encerrado">Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 3 ??" Vigência e Financeiro */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Vigência e Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input 
                    id="dataInicio"
                    type="date" 
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataTermino">Data de Término / Renovação</Label>
                  <Input 
                    id="dataTermino"
                    type="date" 
                    value={dataTermino}
                    onChange={(e) => setDataTermino(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diaVencimento">Dia de Vencimento *</Label>
                  <Select value={diaVencimento} onValueChange={setDiaVencimento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                        <SelectItem key={dia} value={dia.toString()}>Dia {dia}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorMensal">Valor Mensal *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="valorMensal"
                      type="text" 
                      placeholder="0,00"
                      className="pl-9"
                      value={valorMensal}
                      onChange={(e) => setValorMensal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reajusteAnual">Reajuste Anual (%)</Label>
                  <Input 
                    id="reajusteAnual"
                    type="text" 
                    placeholder="Ex: IGPM + 5%"
                    value={reajusteAnual}
                    onChange={(e) => setReajusteAnual(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="multaContratual">Multa Contratual (%)</Label>
                  <Input 
                    id="multaContratual"
                    type="text" 
                    placeholder="Ex: 10%"
                    value={multaContratual}
                    onChange={(e) => setMultaContratual(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 4 ??" Serviços Inclusos no Contrato */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Serviços Inclusos no Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {servicosContrato.map((servico, index) => (
                  <div key={servico.id} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-muted-foreground">Serviço {index + 1}</span>
                      {servicosContrato.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerServico(servico.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Tipo de Serviço *</Label>
                        <Select 
                          value={servico.tipoServico} 
                          onValueChange={(v) => atualizarServico(servico.id, "tipoServico", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposServico.map(tipo => (
                              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Frequência *</Label>
                        <Select 
                          value={servico.frequencia} 
                          onValueChange={(v) => atualizarServico(servico.id, "frequencia", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencias.map(freq => (
                              <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Limites</Label>
                        <Input 
                          placeholder="Ex: até 10 caixas, até 50 pontos"
                          value={servico.limites}
                          onChange={(e) => atualizarServico(servico.id, "limites", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={adicionarServico}
                  className="w-full border-dashed bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar serviço ao contrato
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 5 ??" Regras de Adicionais */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Regras de Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adicionalDescricao">O que é considerado adicional?</Label>
                  <Textarea 
                    id="adicionalDescricao"
                    placeholder="Descreva o que será considerado serviço adicional fora do contrato..."
                    rows={3}
                    value={adicionalDescricao}
                    onChange={(e) => setAdicionalDescricao(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="exigeAprovacao" className="font-medium">Exige aprovação prévia do cliente?</Label>
                    <p className="text-sm text-muted-foreground">O cliente deve aprovar serviços adicionais antes da execução</p>
                  </div>
                  <Switch
                    id="exigeAprovacao"
                    checked={exigeAprovacao}
                    onCheckedChange={setExigeAprovacao}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoesContratuais">Observações Contratuais</Label>
                  <Textarea 
                    id="observacoesContratuais"
                    placeholder="Observações específicas sobre regras de adicionais..."
                    rows={2}
                    value={observacoesContratuais}
                    onChange={(e) => setObservacoesContratuais(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 6 ??" Observações Internas */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Observações Internas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="observacoesInternas">Observações Administrativas</Label>
                  <Textarea 
                    id="observacoesInternas"
                    placeholder="Observações internas sobre o contrato (não visível para o cliente)..."
                    rows={3}
                    value={observacoesInternas}
                    onChange={(e) => setObservacoesInternas(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload de Contrato Assinado (opcional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="arquivoContrato"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="arquivoContrato" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      {arquivoContrato ? (
                        <p className="text-sm text-foreground font-medium">{arquivoContrato.name}</p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">Clique para fazer upload</p>
                          <p className="text-xs text-muted-foreground">PDF, DOC ou DOCX</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 7 ??" Ações */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end p-4 bg-background border rounded-lg sticky bottom-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/clientes')}
              className="sm:order-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="sm:order-2 bg-transparent"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir / PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleSalvarECadastrarServico}
              className="sm:order-3 bg-transparent"
              disabled={isSavingContrato}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Salvar e Cadastrar Serviço
            </Button>
            <Button
              onClick={handleSalvar}
              className="sm:order-4"
              disabled={isSavingContrato}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Contrato
            </Button>
          </div>
        </div>
      </main>

      {/* Diálogo de confirmação de contrato */}
      <ConfirmActionDialog
        open={confirmContrato.open}
        title="Confirmar cadastro do contrato"
        description="Revise os dados abaixo antes de salvar o contrato."
        details={[
          { label: "Cliente", value: clienteSelecionado?.nome || "" },
          { label: "Documento", value: clienteSelecionado?.cpfCnpj || "" },
          { label: "Tipo de contrato", value: tipoContrato || "" },
          { label: "Status", value: statusContrato || "" },
          { label: "Vigência", value: dataInicio && dataTermino ? `${dataInicio} a ${dataTermino}` : dataInicio || "" },
          { label: "Valor mensal", value: valorMensal ? `R$ ${valorMensal}` : "" },
          { label: "Serviços inclusos", value: `${servicosContrato.filter(s => s.tipoServico).length} serviço(s)` },
          { label: "Ação", value: confirmContrato.afterSave === "servico" ? "Salvar e cadastrar serviço" : "Salvar contrato" },
        ]}
        confirmLabel={isSavingContrato ? "Salvando..." : "Confirmar"}
        isLoading={isSavingContrato}
        onConfirm={() => void handleExecuteSalvarContrato()}
        onCancel={() => setConfirmContrato({ open: false, afterSave: null })}
      />
    </div>
  )
}





















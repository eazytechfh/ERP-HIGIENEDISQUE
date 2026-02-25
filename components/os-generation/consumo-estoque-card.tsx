"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Plus, Trash2, Search, AlertTriangle, CheckCircle, Info } from "lucide-react"

// Tipos
export type CategoriaEstoque = "Produto Quimico" | "Diluente" | "EPI"
export type UnidadeEstoque = "L" | "ml" | "g" | "kg" | "unid"

export type ItemEstoque = {
  id: string
  nome: string
  categoria: CategoriaEstoque
  unidadePadrao: UnidadeEstoque
  estoqueAtual: number
  estoqueMinimo: number
}

export type ConsumoItem = {
  id: string
  produtoId: string
  produtoNome: string
  categoria: CategoriaEstoque
  quantidade: number
  unidade: UnidadeEstoque
  estoqueAntes: number
  saldoEstimado: number
  observacao: string
}

// Mock do estoque
const estoqueMock: ItemEstoque[] = [
  { id: "est1", nome: "Cipermetrina 25% CE", categoria: "Produto Quimico", unidadePadrao: "L", estoqueAtual: 45, estoqueMinimo: 10 },
  { id: "est2", nome: "Deltametrina SC", categoria: "Produto Quimico", unidadePadrao: "L", estoqueAtual: 12, estoqueMinimo: 5 },
  { id: "est3", nome: "Gel Baraticida MaxForce", categoria: "Produto Quimico", unidadePadrao: "unid", estoqueAtual: 8, estoqueMinimo: 5 },
  { id: "est4", nome: "Raticida Granulado", categoria: "Produto Quimico", unidadePadrao: "kg", estoqueAtual: 30, estoqueMinimo: 10 },
  { id: "est5", nome: "Diluente Querosene", categoria: "Diluente", unidadePadrao: "L", estoqueAtual: 100, estoqueMinimo: 20 },
  { id: "est6", nome: "Oleo Mineral", categoria: "Diluente", unidadePadrao: "L", estoqueAtual: 20, estoqueMinimo: 5 },
  { id: "est7", nome: "Luva Nitrilica", categoria: "EPI", unidadePadrao: "unid", estoqueAtual: 15, estoqueMinimo: 10 },
  { id: "est8", nome: "Mascara PFF2", categoria: "EPI", unidadePadrao: "unid", estoqueAtual: 10, estoqueMinimo: 5 },
]

type ConsumoEstoqueCardProps = {
  consumos: ConsumoItem[]
  onConsumosChange: (consumos: ConsumoItem[]) => void
  estoqueSimulado: ItemEstoque[]
  onEstoqueSimuladoChange: (estoque: ItemEstoque[]) => void
}

export function ConsumoEstoqueCard({ 
  consumos, 
  onConsumosChange, 
  estoqueSimulado, 
  onEstoqueSimuladoChange 
}: ConsumoEstoqueCardProps) {
  // Estados locais
  const [searchTerm, setSearchTerm] = useState("")
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [observacao, setObservacao] = useState("")
  const [erro, setErro] = useState("")

  // Filtrar produtos pela busca
  const produtosFiltrados = estoqueSimulado.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Produto selecionado
  const produtoSelecionado = estoqueSimulado.find(p => p.id === produtoSelecionadoId)

  // Calcular status do estoque
  const getStatusEstoque = (item: ItemEstoque) => {
    if (item.estoqueAtual <= 0) return "critico"
    if (item.estoqueAtual <= item.estoqueMinimo) return "alerta"
    return "ok"
  }

  // Handler para adicionar consumo
  const handleAdicionarConsumo = () => {
    setErro("")

    if (!produtoSelecionadoId) {
      setErro("Selecione um produto")
      return
    }

    const qtd = parseFloat(quantidade)
    if (isNaN(qtd) || qtd <= 0) {
      setErro("Informe uma quantidade valida maior que zero")
      return
    }

    const produto = estoqueSimulado.find(p => p.id === produtoSelecionadoId)
    if (!produto) return

    if (qtd > produto.estoqueAtual) {
      setErro(`Quantidade maior que o estoque disponivel (${produto.estoqueAtual} ${produto.unidadePadrao})`)
      return
    }

    // Criar novo consumo
    const novoConsumo: ConsumoItem = {
      id: `cons-${Date.now()}`,
      produtoId: produto.id,
      produtoNome: produto.nome,
      categoria: produto.categoria,
      quantidade: qtd,
      unidade: produto.unidadePadrao,
      estoqueAntes: produto.estoqueAtual,
      saldoEstimado: produto.estoqueAtual - qtd,
      observacao: observacao
    }

    // Atualizar estoque simulado
    const novoEstoque = estoqueSimulado.map(item => 
      item.id === produto.id 
        ? { ...item, estoqueAtual: item.estoqueAtual - qtd }
        : item
    )

    onConsumosChange([...consumos, novoConsumo])
    onEstoqueSimuladoChange(novoEstoque)

    // Limpar formulário
    setProdutoSelecionadoId("")
    setQuantidade("")
    setObservacao("")
    setSearchTerm("")
  }

  // Handler para remover consumo
  const handleRemoverConsumo = (consumoId: string) => {
    const consumo = consumos.find(c => c.id === consumoId)
    if (!consumo) return

    // Devolver quantidade ao estoque simulado
    const novoEstoque = estoqueSimulado.map(item => 
      item.id === consumo.produtoId 
        ? { ...item, estoqueAtual: item.estoqueAtual + consumo.quantidade }
        : item
    )

    onConsumosChange(consumos.filter(c => c.id !== consumoId))
    onEstoqueSimuladoChange(novoEstoque)
  }

  // Calcular resumo
  const resumo = {
    totalItens: consumos.length,
    porCategoria: {
      quimico: consumos.filter(c => c.categoria === "Produto Quimico").length,
      diluente: consumos.filter(c => c.categoria === "Diluente").length,
      epi: consumos.filter(c => c.categoria === "EPI").length,
    },
    itensAbaixoMinimo: estoqueSimulado.filter(item => 
      item.estoqueAtual > 0 && item.estoqueAtual <= item.estoqueMinimo
    ).length,
    itensCriticos: estoqueSimulado.filter(item => item.estoqueAtual <= 0).length
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Consumo de Produtos (Estoque)
        </CardTitle>
        <CardDescription>
          Registre os produtos consumidos durante o servico. O estoque sera atualizado apos confirmacao.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário de adição */}
        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Busca e seleção de produto */}
            <div className="space-y-2 md:col-span-2">
              <Label>Buscar Produto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Produto *</Label>
              <Select
                value={produtoSelecionadoId}
                onValueChange={setProdutoSelecionadoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtosFiltrados.map(produto => {
                    const status = getStatusEstoque(produto)
                    return (
                      <SelectItem key={produto.id} value={produto.id}>
                        <div className="flex items-center gap-2">
                          <span>{produto.nome}</span>
                          <Badge 
                            variant={status === "ok" ? "outline" : status === "alerta" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {produto.estoqueAtual} {produto.unidadePadrao}
                          </Badge>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Mini-info do produto selecionado */}
            {produtoSelecionado && (
              <div className="md:col-span-2 p-3 bg-background border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{produtoSelecionado.nome}</p>
                    <p className="text-xs text-muted-foreground">{produtoSelecionado.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Estoque: </span>
                      <span className="font-semibold">{produtoSelecionado.estoqueAtual} {produtoSelecionado.unidadePadrao}</span>
                    </p>
                    <Badge 
                      variant={
                        getStatusEstoque(produtoSelecionado) === "ok" ? "outline" : 
                        getStatusEstoque(produtoSelecionado) === "alerta" ? "secondary" : "destructive"
                      }
                      className="text-xs"
                    >
                      {getStatusEstoque(produtoSelecionado) === "ok" ? "OK" : 
                       getStatusEstoque(produtoSelecionado) === "alerta" ? "Alerta" : "Critico"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="Ex: 2.5"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input
                value={produtoSelecionado?.unidadePadrao || "-"}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Observacao (local/setor de aplicacao)</Label>
              <Textarea
                placeholder="Ex: Aplicado na cozinha e area de servico"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {erro}
            </div>
          )}

          <Button onClick={handleAdicionarConsumo} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Consumo
          </Button>
        </div>

        <Separator />

        {/* Tabela de consumos */}
        <div>
          <h4 className="font-semibold mb-3">Consumos Registrados</h4>
          {consumos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum consumo registrado ainda.</p>
              <p className="text-xs">Adicione produtos consumidos usando o formulario acima.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead>Unid</TableHead>
                    <TableHead className="text-right">Estoque Antes</TableHead>
                    <TableHead className="text-right">Saldo Estimado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumos.map(consumo => {
                    const produtoAtual = estoqueSimulado.find(p => p.id === consumo.produtoId)
                    const statusSaldo = produtoAtual && produtoAtual.estoqueAtual <= produtoAtual.estoqueMinimo
                    return (
                      <TableRow key={consumo.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{consumo.produtoNome}</p>
                            {consumo.observacao && (
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">{consumo.observacao}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {consumo.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{consumo.quantidade}</TableCell>
                        <TableCell>{consumo.unidade}</TableCell>
                        <TableCell className="text-right">{consumo.estoqueAntes}</TableCell>
                        <TableCell className="text-right">
                          <span className={statusSaldo ? "text-amber-600 font-semibold" : ""}>
                            {consumo.saldoEstimado}
                          </span>
                          {statusSaldo && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              Critico
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoverConsumo(consumo.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Resumo do consumo */}
        {consumos.length > 0 && (
          <>
            <Separator />
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Resumo do Consumo
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total de Itens</p>
                  <p className="font-semibold text-lg">{resumo.totalItens}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Categorias</p>
                  <p className="font-medium">
                    {resumo.porCategoria.quimico > 0 && `${resumo.porCategoria.quimico} Quimico`}
                    {resumo.porCategoria.quimico > 0 && (resumo.porCategoria.diluente > 0 || resumo.porCategoria.epi > 0) && ", "}
                    {resumo.porCategoria.diluente > 0 && `${resumo.porCategoria.diluente} Diluente`}
                    {resumo.porCategoria.diluente > 0 && resumo.porCategoria.epi > 0 && ", "}
                    {resumo.porCategoria.epi > 0 && `${resumo.porCategoria.epi} EPI`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Itens em Alerta</p>
                  <p className={`font-semibold ${resumo.itensAbaixoMinimo > 0 ? "text-amber-600" : ""}`}>
                    {resumo.itensAbaixoMinimo}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Itens Criticos</p>
                  <p className={`font-semibold ${resumo.itensCriticos > 0 ? "text-destructive" : ""}`}>
                    {resumo.itensCriticos}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>O consumo e opcional neste momento. A OS pode ser gerada antes da execucao e o consumo registrado apos o servico.</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Função para inicializar estoque (para uso na página)
export function getEstoqueMock(): ItemEstoque[] {
  return [...estoqueMock]
}

// Exportar tipo do mock para uso externo
export type { ItemEstoque as EstoqueItem }

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Bug, Plus, Trash2 } from "lucide-react"

export type PragaAlvo = "baratas" | "formigas" | "ratos" | "mosquitos" | "cupins" | "pulgas_carrapatos" | "outros"
export type TipoAtividade = "quimico" | "nao_quimico"

export type ProdutoUtilizado = {
  id: string
  produto: string
  principioAtivo: string
  concentracao: string
  diluicao: string
  quantidade: string
  pragaAlvo: string
  equipamento: string
}

export type DadosTecnicosVetores = {
  pragasAlvo: PragaAlvo[]
  tipoAtividade: TipoAtividade
  descricaoServico: string
  produtos: ProdutoUtilizado[]
  medidasPreventivas: string
  aplicador: string
  tecnicoResponsavel: string
  registroTecnico: string
}

type VetoresFormProps = {
  dados: DadosTecnicosVetores
  onChange: (dados: DadosTecnicosVetores) => void
}

const pragasOptions: { value: PragaAlvo; label: string }[] = [
  { value: "baratas", label: "Baratas" },
  { value: "formigas", label: "Formigas" },
  { value: "ratos", label: "Ratos" },
  { value: "mosquitos", label: "Mosquitos" },
  { value: "cupins", label: "Cupins" },
  { value: "pulgas_carrapatos", label: "Pulgas/Carrapatos" },
  { value: "outros", label: "Outros" },
]

const produtosMock = [
  "Cipermetrina 25%",
  "Deltametrina 2,5%",
  "Lambdacialotrina 10%",
  "Fipronil 0,5%",
  "Imidacloprido 21%",
  "Gel Barata",
  "Raticida em Bloco",
]

const equipamentosMock = [
  "Pulverizador Costal 20L",
  "Atomizador Motorizado",
  "Nebulizador UBV",
  "Aplicador de Gel",
  "Polvilhadeira Manual",
]

export function VetoresForm({ dados, onChange }: VetoresFormProps) {
  const handlePragaChange = (praga: PragaAlvo, checked: boolean) => {
    const newPragas = checked
      ? [...dados.pragasAlvo, praga]
      : dados.pragasAlvo.filter(p => p !== praga)
    onChange({ ...dados, pragasAlvo: newPragas })
  }

  const handleAddProduto = () => {
    const novoProduto: ProdutoUtilizado = {
      id: `prod-${Date.now()}`,
      produto: "",
      principioAtivo: "",
      concentracao: "",
      diluicao: "",
      quantidade: "",
      pragaAlvo: "",
      equipamento: "",
    }
    onChange({ ...dados, produtos: [...dados.produtos, novoProduto] })
  }

  const handleRemoveProduto = (id: string) => {
    onChange({ ...dados, produtos: dados.produtos.filter(p => p.id !== id) })
  }

  const handleProdutoChange = (id: string, field: keyof ProdutoUtilizado, value: string) => {
    onChange({
      ...dados,
      produtos: dados.produtos.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-primary" />
          Dados Tecnicos da OS Vetores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pragas/Vetores Alvo */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Pragas/Vetores Alvo</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pragasOptions.map(praga => (
              <div key={praga.value} className="flex items-center space-x-2">
                <Checkbox
                  id={praga.value}
                  checked={dados.pragasAlvo.includes(praga.value)}
                  onCheckedChange={(checked) => handlePragaChange(praga.value, checked as boolean)}
                />
                <Label htmlFor={praga.value} className="font-normal cursor-pointer">
                  {praga.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Tipo de Atividade */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Tipo de Atividade</Label>
          <RadioGroup
            value={dados.tipoAtividade}
            onValueChange={(value) => onChange({ ...dados, tipoAtividade: value as TipoAtividade })}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quimico" id="quimico" />
              <Label htmlFor="quimico" className="font-normal cursor-pointer">Controle Quimico</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao_quimico" id="nao_quimico" />
              <Label htmlFor="nao_quimico" className="font-normal cursor-pointer">Controle Nao Quimico</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Descricao do Servico */}
        <div className="space-y-2">
          <Label htmlFor="descricaoServico" className="text-base font-medium">Descricao do Servico Executado</Label>
          <Textarea
            id="descricaoServico"
            value={dados.descricaoServico}
            onChange={(e) => onChange({ ...dados, descricaoServico: e.target.value })}
            placeholder="Descreva detalhadamente o servico executado..."
            rows={3}
          />
        </div>

        <Separator />

        {/* Produtos Utilizados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Produtos Utilizados</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProduto}
              className="gap-2 bg-transparent"
            >
              <Plus className="h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>

          {dados.produtos.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
              Nenhum produto adicionado. Clique em "Adicionar Produto" para comecar.
            </div>
          )}

          {dados.produtos.map((produto, index) => (
            <div key={produto.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Produto {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveProduto(produto.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select
                    value={produto.produto}
                    onValueChange={(value) => handleProdutoChange(produto.id, "produto", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosMock.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Principio Ativo</Label>
                  <Input
                    value={produto.principioAtivo}
                    onChange={(e) => handleProdutoChange(produto.id, "principioAtivo", e.target.value)}
                    placeholder="Ex: Cipermetrina"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Concentracao</Label>
                  <Input
                    value={produto.concentracao}
                    onChange={(e) => handleProdutoChange(produto.id, "concentracao", e.target.value)}
                    placeholder="Ex: 25%"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Diluicao / Diluente</Label>
                  <Input
                    value={produto.diluicao}
                    onChange={(e) => handleProdutoChange(produto.id, "diluicao", e.target.value)}
                    placeholder="Ex: 10ml/L agua"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    value={produto.quantidade}
                    onChange={(e) => handleProdutoChange(produto.id, "quantidade", e.target.value)}
                    placeholder="Ex: 500ml"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Praga Alvo</Label>
                  <Select
                    value={produto.pragaAlvo}
                    onValueChange={(value) => handleProdutoChange(produto.id, "pragaAlvo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {pragasOptions.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <Label>Equipamento Utilizado</Label>
                  <Select
                    value={produto.equipamento}
                    onValueChange={(value) => handleProdutoChange(produto.id, "equipamento", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipamentosMock.map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Medidas Preventivas/Corretivas */}
        <div className="space-y-2">
          <Label htmlFor="medidasPreventivas" className="text-base font-medium">Medidas Preventivas/Corretivas</Label>
          <Textarea
            id="medidasPreventivas"
            value={dados.medidasPreventivas}
            onChange={(e) => onChange({ ...dados, medidasPreventivas: e.target.value })}
            placeholder="Descreva as medidas preventivas e/ou corretivas recomendadas..."
            rows={3}
          />
        </div>

        <Separator />

        {/* Responsaveis Tecnicos */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Responsaveis Tecnicos</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aplicador">Aplicador</Label>
              <Input
                id="aplicador"
                value={dados.aplicador}
                onChange={(e) => onChange({ ...dados, aplicador: e.target.value })}
                placeholder="Nome do aplicador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tecnicoResponsavel">Tecnico Responsavel</Label>
              <Input
                id="tecnicoResponsavel"
                value={dados.tecnicoResponsavel}
                onChange={(e) => onChange({ ...dados, tecnicoResponsavel: e.target.value })}
                placeholder="Nome do tecnico"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registroTecnico">Registro/Identificacao</Label>
              <Input
                id="registroTecnico"
                value={dados.registroTecnico}
                onChange={(e) => onChange({ ...dados, registroTecnico: e.target.value })}
                placeholder="Ex: CRQ-123456"
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          Preparado para integracao futura com tabela de produtos e equipe.
        </div>
      </CardContent>
    </Card>
  )
}

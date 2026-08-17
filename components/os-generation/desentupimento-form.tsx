"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Wrench, Plus, Trash2 } from "lucide-react"

export type ServicoDesentupimento = {
  id: string
  descricao: string
  garantia: string
  valorServico: string
}

export type DadosTecnicosDesentupimento = {
  horaServico: string
  atendente: string
  tecnico: string
  vendedor: string
  inscricao: string
  homePage: string
  contatos: string
  origem: string
  referencia: string
  observacoes: string
  servicos: ServicoDesentupimento[]
  desconto: string
  condicaoPagamento: string
}

type DesentupimentoFormProps = {
  dados: DadosTecnicosDesentupimento
  onChange: (dados: DadosTecnicosDesentupimento) => void
}

export function DesentupimentoForm({ dados, onChange }: DesentupimentoFormProps) {
  const handleAddServico = () => {
    const novoServico: ServicoDesentupimento = {
      id: `serv-${Date.now()}`,
      descricao: "",
      garantia: "",
      valorServico: "",
    }
    onChange({ ...dados, servicos: [...dados.servicos, novoServico] })
  }

  const handleRemoveServico = (id: string) => {
    onChange({ ...dados, servicos: dados.servicos.filter((s) => s.id !== id) })
  }

  const handleServicoChange = (id: string, field: keyof ServicoDesentupimento, value: string) => {
    onChange({
      ...dados,
      servicos: dados.servicos.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Dados Tecnicos - Desentupimento (Demonstrativo de Pedido)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="horaServico">Hora Servico</Label>
            <Input
              id="horaServico"
              value={dados.horaServico}
              onChange={(e) => onChange({ ...dados, horaServico: e.target.value })}
              placeholder="Ex: Entre 09:00hs e 10:00hs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tecnico">Tecnico</Label>
            <Input
              id="tecnico"
              value={dados.tecnico}
              onChange={(e) => onChange({ ...dados, tecnico: e.target.value })}
              placeholder="Nome do tecnico responsavel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="atendente">Atendente</Label>
            <Input
              id="atendente"
              value={dados.atendente}
              onChange={(e) => onChange({ ...dados, atendente: e.target.value })}
              placeholder="Nome do atendente"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendedor">Vendedor</Label>
            <Input
              id="vendedor"
              value={dados.vendedor}
              onChange={(e) => onChange({ ...dados, vendedor: e.target.value })}
              placeholder="Nome do vendedor"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inscricao">Inscricao</Label>
            <Input
              id="inscricao"
              value={dados.inscricao}
              onChange={(e) => onChange({ ...dados, inscricao: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="homePage">Home Page</Label>
            <Input
              id="homePage"
              value={dados.homePage}
              onChange={(e) => onChange({ ...dados, homePage: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contatos">Contatos</Label>
            <Input
              id="contatos"
              value={dados.contatos}
              onChange={(e) => onChange({ ...dados, contatos: e.target.value })}
              placeholder="Ex: Fernanda (sindica)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origem">Origem</Label>
            <Input
              id="origem"
              value={dados.origem}
              onChange={(e) => onChange({ ...dados, origem: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="referencia">Referencia</Label>
            <Input
              id="referencia"
              value={dados.referencia}
              onChange={(e) => onChange({ ...dados, referencia: e.target.value })}
              placeholder="Ex: Ao lado de Caio Martins"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoesDesentupimento">Observacoes</Label>
          <Textarea
            id="observacoesDesentupimento"
            value={dados.observacoes}
            onChange={(e) => onChange({ ...dados, observacoes: e.target.value })}
            placeholder="Ex: 8 andares, 1 salao de festa, 1 cx. d agua, 1 cisterna e 3 cx gordura"
            rows={2}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Servicos</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddServico} className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Adicionar Servico
            </Button>
          </div>

          {dados.servicos.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
              Nenhum servico adicionado. Clique em "Adicionar Servico" para comecar.
            </div>
          )}

          {dados.servicos.map((servico) => (
            <div key={servico.id} className="p-4 border rounded-lg space-y-4 bg-card">
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveServico(servico.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label>Descricao</Label>
                  <Input
                    value={servico.descricao}
                    onChange={(e) => handleServicoChange(servico.id, "descricao", e.target.value)}
                    placeholder="Ex: Desentupimento"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Garantia</Label>
                  <Input
                    value={servico.garantia}
                    onChange={(e) => handleServicoChange(servico.id, "garantia", e.target.value)}
                    placeholder="Ex: 00 Meses"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Servico</Label>
                  <Input
                    value={servico.valorServico}
                    onChange={(e) => handleServicoChange(servico.id, "valorServico", e.target.value)}
                    placeholder="Ex: R$ 0,00"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="desconto">Desconto</Label>
            <Input
              id="desconto"
              value={dados.desconto}
              onChange={(e) => onChange({ ...dados, desconto: e.target.value })}
              placeholder="Ex: R$ 0,00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condicaoPagamento">Condicao de Pagamento</Label>
            <Input
              id="condicaoPagamento"
              value={dados.condicaoPagamento}
              onChange={(e) => onChange({ ...dados, condicaoPagamento: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

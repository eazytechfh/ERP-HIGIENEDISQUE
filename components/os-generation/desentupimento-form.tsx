"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Wrench } from "lucide-react"

export type TipoDesentupimento = "mecanico" | "hidrojateamento" | "quimico" | "outro"
export type SituacaoDesentupimento = "desobstruido_totalmente" | "desobstruido_parcialmente" | "necessita_retorno"

export type DadosTecnicosDesentupimento = {
  localEntupimento: string
  tipoDesentupimento: TipoDesentupimento
  equipamentoUtilizado: string
  diagnostico: string
  materialRemovido: string
  situacaoFinal: SituacaoDesentupimento
  observacoes: string
  aplicador: string
  tecnicoResponsavel: string
  registroTecnico: string
}

type DesentupimentoFormProps = {
  dados: DadosTecnicosDesentupimento
  onChange: (dados: DadosTecnicosDesentupimento) => void
}

export function DesentupimentoForm({ dados, onChange }: DesentupimentoFormProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Dados Tecnicos - Desentupimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="localEntupimento">Local do Entupimento</Label>
            <Input
              id="localEntupimento"
              value={dados.localEntupimento}
              onChange={(e) => onChange({ ...dados, localEntupimento: e.target.value })}
              placeholder="Ex: Pia da cozinha, Vaso sanitario, Rede de esgoto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipamentoUtilizado">Equipamento Utilizado</Label>
            <Input
              id="equipamentoUtilizado"
              value={dados.equipamentoUtilizado}
              onChange={(e) => onChange({ ...dados, equipamentoUtilizado: e.target.value })}
              placeholder="Ex: Maquina de desentupir eletrica, Hidrojato"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Desentupimento</Label>
          <RadioGroup
            value={dados.tipoDesentupimento}
            onValueChange={(value) => onChange({ ...dados, tipoDesentupimento: value as TipoDesentupimento })}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mecanico" id="tipo-mecanico" />
              <Label htmlFor="tipo-mecanico" className="font-normal cursor-pointer text-sm">Mecanico</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hidrojateamento" id="tipo-hidrojateamento" />
              <Label htmlFor="tipo-hidrojateamento" className="font-normal cursor-pointer text-sm">Hidrojateamento</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quimico" id="tipo-quimico" />
              <Label htmlFor="tipo-quimico" className="font-normal cursor-pointer text-sm">Quimico</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outro" id="tipo-outro" />
              <Label htmlFor="tipo-outro" className="font-normal cursor-pointer text-sm">Outro</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnostico">Diagnostico / Causa do Entupimento</Label>
          <Textarea
            id="diagnostico"
            value={dados.diagnostico}
            onChange={(e) => onChange({ ...dados, diagnostico: e.target.value })}
            placeholder="Descreva a causa identificada do entupimento"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="materialRemovido">Material Removido</Label>
          <Textarea
            id="materialRemovido"
            value={dados.materialRemovido}
            onChange={(e) => onChange({ ...dados, materialRemovido: e.target.value })}
            placeholder="Descreva o material/residuo removido durante o servico"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Situacao Final</Label>
          <RadioGroup
            value={dados.situacaoFinal}
            onValueChange={(value) => onChange({ ...dados, situacaoFinal: value as SituacaoDesentupimento })}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="desobstruido_totalmente" id="situacao-total" />
              <Label htmlFor="situacao-total" className="font-normal cursor-pointer text-sm">Desobstruido Totalmente</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="desobstruido_parcialmente" id="situacao-parcial" />
              <Label htmlFor="situacao-parcial" className="font-normal cursor-pointer text-sm">Desobstruido Parcialmente</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="necessita_retorno" id="situacao-retorno" />
              <Label htmlFor="situacao-retorno" className="font-normal cursor-pointer text-sm">Necessita Retorno</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoesDesentupimento">Observacoes</Label>
          <Textarea
            id="observacoesDesentupimento"
            value={dados.observacoes}
            onChange={(e) => onChange({ ...dados, observacoes: e.target.value })}
            placeholder="Recomendacoes ao cliente, observacoes adicionais..."
            rows={2}
          />
        </div>

        <div className="space-y-4">
          <Label className="text-base font-medium">Responsaveis Tecnicos</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aplicadorDesentupimento">Aplicador</Label>
              <Input
                id="aplicadorDesentupimento"
                value={dados.aplicador}
                onChange={(e) => onChange({ ...dados, aplicador: e.target.value })}
                placeholder="Nome do aplicador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tecnicoResponsavelDesentupimento">Tecnico Responsavel</Label>
              <Input
                id="tecnicoResponsavelDesentupimento"
                value={dados.tecnicoResponsavel}
                onChange={(e) => onChange({ ...dados, tecnicoResponsavel: e.target.value })}
                placeholder="Nome do tecnico"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registroTecnicoDesentupimento">Registro (se aplicavel)</Label>
              <Input
                id="registroTecnicoDesentupimento"
                value={dados.registroTecnico}
                onChange={(e) => onChange({ ...dados, registroTecnico: e.target.value })}
                placeholder="Ex: 55953/02 RJ"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

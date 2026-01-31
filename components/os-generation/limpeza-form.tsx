"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Droplets, Plus, Trash2 } from "lucide-react"

export type TipoReservatorio = "cisterna" | "caixa_dagua"
export type TipoMaterial = "concreto" | "polietileno" | "outros"
export type SituacaoSolo = "elevada" | "apoiada" | "enterrada" | "semi_enterrada"
export type CondicaoCobertura = "totalmente_coberta" | "parcialmente_coberta"
export type SimNao = "sim" | "nao"

export type Reservatorio = {
  id: string
  tipo: TipoReservatorio
  numero: number
  volumeM3: string
  tipoMaterial: TipoMaterial
  situacaoSolo: SituacaoSolo
  condicaoCobertura: CondicaoCobertura
  presencaDetritos: SimNao
  presencaVetores: SimNao
  proximidadeFossaEsgoto: SimNao
  ocorrenciaFendasRachaduras: SimNao
}

export type DadosTecnicosLimpeza = {
  reservatorios: Reservatorio[]
  aplicador: string
  tecnicoResponsavel: string
  registroTecnico: string
}

type LimpezaFormProps = {
  dados: DadosTecnicosLimpeza
  onChange: (dados: DadosTecnicosLimpeza) => void
}

export function LimpezaForm({ dados, onChange }: LimpezaFormProps) {
  const handleAddReservatorio = (tipo: TipoReservatorio) => {
    const existentes = dados.reservatorios.filter(r => r.tipo === tipo)
    const novoReservatorio: Reservatorio = {
      id: `res-${Date.now()}`,
      tipo,
      numero: existentes.length + 1,
      volumeM3: "",
      tipoMaterial: "polietileno",
      situacaoSolo: "elevada",
      condicaoCobertura: "totalmente_coberta",
      presencaDetritos: "nao",
      presencaVetores: "nao",
      proximidadeFossaEsgoto: "nao",
      ocorrenciaFendasRachaduras: "nao",
    }
    onChange({ ...dados, reservatorios: [...dados.reservatorios, novoReservatorio] })
  }

  const handleRemoveReservatorio = (id: string) => {
    onChange({ ...dados, reservatorios: dados.reservatorios.filter(r => r.id !== id) })
  }

  const handleReservatorioChange = (id: string, field: keyof Reservatorio, value: string) => {
    onChange({
      ...dados,
      reservatorios: dados.reservatorios.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    })
  }

  const cisternas = dados.reservatorios.filter(r => r.tipo === "cisterna")
  const caixasDagua = dados.reservatorios.filter(r => r.tipo === "caixa_dagua")

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          Dados Tecnicos - Limpeza de Reservatorios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cisternas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Cisternas</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddReservatorio("cisterna")}
              className="gap-2 bg-transparent"
            >
              <Plus className="h-4 w-4" />
              Adicionar Cisterna
            </Button>
          </div>

          {cisternas.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
              Nenhuma cisterna adicionada. Clique em "Adicionar Cisterna" para comecar.
            </div>
          )}

          {cisternas.map((reservatorio, index) => (
            <ReservatorioCard
              key={reservatorio.id}
              reservatorio={reservatorio}
              index={index + 1}
              onRemove={() => handleRemoveReservatorio(reservatorio.id)}
              onChange={(field, value) => handleReservatorioChange(reservatorio.id, field, value)}
            />
          ))}
        </div>

        <Separator />

        {/* Caixas D'Agua */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Caixas D'Agua</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddReservatorio("caixa_dagua")}
              className="gap-2 bg-transparent"
            >
              <Plus className="h-4 w-4" />
              Adicionar Caixa D'Agua
            </Button>
          </div>

          {caixasDagua.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
              Nenhuma caixa d'agua adicionada. Clique em "Adicionar Caixa D'Agua" para comecar.
            </div>
          )}

          {caixasDagua.map((reservatorio, index) => (
            <ReservatorioCard
              key={reservatorio.id}
              reservatorio={reservatorio}
              index={index + 1}
              onRemove={() => handleRemoveReservatorio(reservatorio.id)}
              onChange={(field, value) => handleReservatorioChange(reservatorio.id, field, value)}
            />
          ))}
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
              <Label htmlFor="registroTecnico">Registro CRBio</Label>
              <Input
                id="registroTecnico"
                value={dados.registroTecnico}
                onChange={(e) => onChange({ ...dados, registroTecnico: e.target.value })}
                placeholder="Ex: 55953/02 RJ"
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          Conforme Art. 3, Decreto RJ n 20356, de 17 de agosto de 1994: a limpeza e higienizacao dos reservatorios de agua deve ser realizada SEMESTRALMENTE.
        </div>
      </CardContent>
    </Card>
  )
}

type ReservatorioCardProps = {
  reservatorio: Reservatorio
  index: number
  onRemove: () => void
  onChange: (field: keyof Reservatorio, value: string) => void
}

function ReservatorioCard({ reservatorio, index, onRemove, onChange }: ReservatorioCardProps) {
  const tipoLabel = reservatorio.tipo === "cisterna" ? "Cisterna" : "Caixa D'Agua"

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {tipoLabel} {index}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Volume */}
        <div className="space-y-2">
          <Label>Volume (M3)</Label>
          <Input
            value={reservatorio.volumeM3}
            onChange={(e) => onChange("volumeM3", e.target.value)}
            placeholder="Ex: 5000"
          />
        </div>

        {/* Tipo de Material */}
        <div className="space-y-2">
          <Label>Tipo de Material</Label>
          <RadioGroup
            value={reservatorio.tipoMaterial}
            onValueChange={(value) => onChange("tipoMaterial", value)}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="concreto" id={`${reservatorio.id}-concreto`} />
              <Label htmlFor={`${reservatorio.id}-concreto`} className="font-normal cursor-pointer text-sm">Concreto</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="polietileno" id={`${reservatorio.id}-polietileno`} />
              <Label htmlFor={`${reservatorio.id}-polietileno`} className="font-normal cursor-pointer text-sm">Polietileno</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outros" id={`${reservatorio.id}-outros`} />
              <Label htmlFor={`${reservatorio.id}-outros`} className="font-normal cursor-pointer text-sm">Outros</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Situacao em relacao ao solo */}
        <div className="space-y-2">
          <Label>Situacao em relacao ao solo</Label>
          <RadioGroup
            value={reservatorio.situacaoSolo}
            onValueChange={(value) => onChange("situacaoSolo", value)}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="elevada" id={`${reservatorio.id}-elevada`} />
              <Label htmlFor={`${reservatorio.id}-elevada`} className="font-normal cursor-pointer text-sm">Elevada</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="apoiada" id={`${reservatorio.id}-apoiada`} />
              <Label htmlFor={`${reservatorio.id}-apoiada`} className="font-normal cursor-pointer text-sm">Apoiada</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="enterrada" id={`${reservatorio.id}-enterrada`} />
              <Label htmlFor={`${reservatorio.id}-enterrada`} className="font-normal cursor-pointer text-sm">Enterrada</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="semi_enterrada" id={`${reservatorio.id}-semi_enterrada`} />
              <Label htmlFor={`${reservatorio.id}-semi_enterrada`} className="font-normal cursor-pointer text-sm">Semi-Enterrada</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Condicoes da Cobertura */}
        <div className="space-y-2">
          <Label>Condicoes da Cobertura</Label>
          <RadioGroup
            value={reservatorio.condicaoCobertura}
            onValueChange={(value) => onChange("condicaoCobertura", value)}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="totalmente_coberta" id={`${reservatorio.id}-totalmente`} />
              <Label htmlFor={`${reservatorio.id}-totalmente`} className="font-normal cursor-pointer text-sm">Totalmente Coberta</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="parcialmente_coberta" id={`${reservatorio.id}-parcialmente`} />
              <Label htmlFor={`${reservatorio.id}-parcialmente`} className="font-normal cursor-pointer text-sm">Parcialmente Coberta</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Presenca de Detritos */}
        <div className="space-y-2">
          <Label>Presenca de Detritos</Label>
          <RadioGroup
            value={reservatorio.presencaDetritos}
            onValueChange={(value) => onChange("presencaDetritos", value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id={`${reservatorio.id}-detritos-sim`} />
              <Label htmlFor={`${reservatorio.id}-detritos-sim`} className="font-normal cursor-pointer text-sm">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id={`${reservatorio.id}-detritos-nao`} />
              <Label htmlFor={`${reservatorio.id}-detritos-nao`} className="font-normal cursor-pointer text-sm">Nao</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Presenca de Vetores */}
        <div className="space-y-2">
          <Label>Presenca de vetores e outros animais nocivos</Label>
          <RadioGroup
            value={reservatorio.presencaVetores}
            onValueChange={(value) => onChange("presencaVetores", value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id={`${reservatorio.id}-vetores-sim`} />
              <Label htmlFor={`${reservatorio.id}-vetores-sim`} className="font-normal cursor-pointer text-sm">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id={`${reservatorio.id}-vetores-nao`} />
              <Label htmlFor={`${reservatorio.id}-vetores-nao`} className="font-normal cursor-pointer text-sm">Nao</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Proximidade de fossas */}
        <div className="space-y-2">
          <Label>Proximidades de fossas ou rede de esgoto</Label>
          <RadioGroup
            value={reservatorio.proximidadeFossaEsgoto}
            onValueChange={(value) => onChange("proximidadeFossaEsgoto", value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id={`${reservatorio.id}-fossa-sim`} />
              <Label htmlFor={`${reservatorio.id}-fossa-sim`} className="font-normal cursor-pointer text-sm">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id={`${reservatorio.id}-fossa-nao`} />
              <Label htmlFor={`${reservatorio.id}-fossa-nao`} className="font-normal cursor-pointer text-sm">Nao</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Ocorrencia de fendas */}
        <div className="space-y-2">
          <Label>Ocorrencia de fendas ou rachaduras</Label>
          <RadioGroup
            value={reservatorio.ocorrenciaFendasRachaduras}
            onValueChange={(value) => onChange("ocorrenciaFendasRachaduras", value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id={`${reservatorio.id}-fendas-sim`} />
              <Label htmlFor={`${reservatorio.id}-fendas-sim`} className="font-normal cursor-pointer text-sm">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id={`${reservatorio.id}-fendas-nao`} />
              <Label htmlFor={`${reservatorio.id}-fendas-nao`} className="font-normal cursor-pointer text-sm">Nao</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}

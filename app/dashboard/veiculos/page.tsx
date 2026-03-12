"use client"

import { useEffect, useMemo, useState } from "react"
import { ErpHeader } from "@/components/erp-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Car, Wrench, Plus, Pencil, Trash2 } from "lucide-react"
import { ensureFlowStoreInitialized, setFlowManutencoes, setFlowVeiculos } from "@/lib/flow-store"

type Veiculo = {
  id: number
  modelo: string
  marca: string
  placa: string
  responsavel: string
  ativo: boolean
}

type StatusManutencao = "Pendente" | "Agendada" | "Concluida"

type ManutencaoPreventiva = {
  id: number
  veiculoId: number
  descricao: string
  dataPrevista: string
  quilometragem: number
  status: StatusManutencao
}

const veiculosMock: Veiculo[] = [
  { id: 1, modelo: "Sprinter 415", marca: "Mercedes", placa: "ABC1D23", responsavel: "Carlos Silva", ativo: true },
  { id: 2, modelo: "Master", marca: "Renault", placa: "QWE4R56", responsavel: "Ana Costa", ativo: true },
  { id: 3, modelo: "Ducato", marca: "Fiat", placa: "RTY7U89", responsavel: "Paulo Lima", ativo: false },
]

const manutencoesMock: ManutencaoPreventiva[] = [
  { id: 1, veiculoId: 1, descricao: "Troca de oleo e filtros", dataPrevista: "2026-03-15", quilometragem: 45000, status: "Pendente" },
  { id: 2, veiculoId: 2, descricao: "Revisao de freios", dataPrevista: "2026-03-10", quilometragem: 62000, status: "Agendada" },
]

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [manutencoes, setManutencoes] = useState<ManutencaoPreventiva[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const store = ensureFlowStoreInitialized("operacional")
    setVeiculos(Array.isArray(store.veiculos) ? (store.veiculos as Veiculo[]) : [])
    setManutencoes(Array.isArray(store.manutencoes) ? (store.manutencoes as ManutencaoPreventiva[]) : [])
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    setFlowVeiculos(veiculos as any[])
  }, [veiculos, loaded])

  useEffect(() => {
    if (!loaded) return
    setFlowManutencoes(manutencoes as any[])
  }, [manutencoes, loaded])
  const [editingVeiculoId, setEditingVeiculoId] = useState<number | null>(null)
  const [editingManutencaoId, setEditingManutencaoId] = useState<number | null>(null)

  const [veiculoForm, setVeiculoForm] = useState({
    modelo: "",
    marca: "",
    placa: "",
    responsavel: "",
    ativo: true,
  })

  const [manutencaoForm, setManutencaoForm] = useState({
    veiculoId: "",
    descricao: "",
    dataPrevista: "",
    quilometragem: "",
    status: "Pendente" as StatusManutencao,
  })

  const veiculosAtivos = useMemo(() => veiculos.filter((v) => v.ativo), [veiculos])

  const resetVeiculoForm = () => {
    setVeiculoForm({ modelo: "", marca: "", placa: "", responsavel: "", ativo: true })
    setEditingVeiculoId(null)
  }

  const resetManutencaoForm = () => {
    setManutencaoForm({ veiculoId: "", descricao: "", dataPrevista: "", quilometragem: "", status: "Pendente" })
    setEditingManutencaoId(null)
  }

  const handleSalvarVeiculo = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      modelo: veiculoForm.modelo.trim(),
      marca: veiculoForm.marca.trim(),
      placa: veiculoForm.placa.trim().toUpperCase(),
      responsavel: veiculoForm.responsavel.trim(),
      ativo: veiculoForm.ativo,
    }

    if (!payload.modelo || !payload.marca || !payload.placa || !payload.responsavel) return

    if (editingVeiculoId) {
      setVeiculos((prev) => prev.map((v) => (v.id === editingVeiculoId ? { ...v, ...payload } : v)))
    } else {
      setVeiculos((prev) => [...prev, { id: Date.now(), ...payload }])
    }

    resetVeiculoForm()
  }

  const handleEditarVeiculo = (veiculo: Veiculo) => {
    setEditingVeiculoId(veiculo.id)
    setVeiculoForm({
      modelo: veiculo.modelo,
      marca: veiculo.marca,
      placa: veiculo.placa,
      responsavel: veiculo.responsavel,
      ativo: veiculo.ativo,
    })
  }

  const handleExcluirVeiculo = (id: number) => {
    setVeiculos((prev) => prev.filter((v) => v.id !== id))
    setManutencoes((prev) => prev.filter((m) => m.veiculoId !== id))
    if (editingVeiculoId === id) resetVeiculoForm()
  }

  const handleSalvarManutencao = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      veiculoId: Number(manutencaoForm.veiculoId),
      descricao: manutencaoForm.descricao.trim(),
      dataPrevista: manutencaoForm.dataPrevista,
      quilometragem: Number(manutencaoForm.quilometragem),
      status: manutencaoForm.status,
    }

    if (!payload.veiculoId || !payload.descricao || !payload.dataPrevista || !payload.quilometragem) return

    if (editingManutencaoId) {
      setManutencoes((prev) => prev.map((m) => (m.id === editingManutencaoId ? { ...m, ...payload } : m)))
    } else {
      setManutencoes((prev) => [...prev, { id: Date.now(), ...payload }])
    }

    resetManutencaoForm()
  }

  const handleEditarManutencao = (m: ManutencaoPreventiva) => {
    setEditingManutencaoId(m.id)
    setManutencaoForm({
      veiculoId: String(m.veiculoId),
      descricao: m.descricao,
      dataPrevista: m.dataPrevista,
      quilometragem: String(m.quilometragem),
      status: m.status,
    })
  }

  const handleExcluirManutencao = (id: number) => {
    if (!window.confirm("Voce tem certeza que deseja excluir esta manutencao preventiva?")) return
    setManutencoes((prev) => prev.filter((m) => m.id !== id))
    if (editingManutencaoId === id) resetManutencaoForm()
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Veiculos</h1>
          <p className="text-muted-foreground">Gestao de frota e manutencoes preventivas (mock local)</p>
        </div>

        <Tabs defaultValue="lista" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-2">
            <TabsTrigger value="lista">Lista de Veiculos</TabsTrigger>
            <TabsTrigger value="cadastro">Cadastrar Veiculo</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" />Frota</CardTitle>
                <CardDescription>{veiculos.length} veiculo(s) cadastrado(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Responsavel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {veiculos.map((v) => (
                        <TableRow key={v.id} className={!v.ativo ? "opacity-60" : ""}>
                          <TableCell>{v.modelo}</TableCell>
                          <TableCell>{v.marca}</TableCell>
                          <TableCell className="font-medium">{v.placa}</TableCell>
                          <TableCell>{v.responsavel}</TableCell>
                          <TableCell>
                            <Badge variant={v.ativo ? "default" : "secondary"}>{v.ativo ? "Ativo" : "Inativo"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditarVeiculo(v)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleExcluirVeiculo(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Manutencoes Preventivas</CardTitle>
                <CardDescription>Lista editavel mock para controle preventivo da frota</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSalvarManutencao} className="grid gap-4 md:grid-cols-5 items-end">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Veiculo</Label>
                    <Select value={manutencaoForm.veiculoId} onValueChange={(value) => setManutencaoForm((p) => ({ ...p, veiculoId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {veiculosAtivos.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>{v.placa} - {v.modelo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label>Descricao</Label>
                    <Input value={manutencaoForm.descricao} onChange={(e) => setManutencaoForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Ex: troca de oleo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data prevista</Label>
                    <Input type="date" value={manutencaoForm.dataPrevista} onChange={(e) => setManutencaoForm((p) => ({ ...p, dataPrevista: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>KM</Label>
                    <Input type="number" value={manutencaoForm.quilometragem} onChange={(e) => setManutencaoForm((p) => ({ ...p, quilometragem: e.target.value }))} placeholder="Ex: 50000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={manutencaoForm.status} onValueChange={(value) => setManutencaoForm((p) => ({ ...p, status: value as StatusManutencao }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Agendada">Agendada</SelectItem>
                        <SelectItem value="Concluida">Concluida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button type="submit" className="w-full"><Plus className="h-4 w-4 mr-2" />{editingManutencaoId ? "Salvar" : "Adicionar"}</Button>
                  </div>
                </form>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veiculo</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>KM</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manutencoes.map((m) => {
                        const veiculo = veiculos.find((v) => v.id === m.veiculoId)
                        return (
                          <TableRow key={m.id}>
                            <TableCell>{veiculo ? `${veiculo.placa} - ${veiculo.modelo}` : "-"}</TableCell>
                            <TableCell>{m.descricao}</TableCell>
                            <TableCell>{m.dataPrevista}</TableCell>
                            <TableCell>{m.quilometragem}</TableCell>
                            <TableCell><Badge variant={m.status === "Concluida" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditarManutencao(m)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleExcluirManutencao(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cadastro">
            <Card>
              <CardHeader>
                <CardTitle>{editingVeiculoId ? "Editar Veiculo" : "Cadastrar Veiculo"}</CardTitle>
                <CardDescription>Preencha os dados basicos do veiculo (mock local)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSalvarVeiculo} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Modelo</Label>
                      <Input value={veiculoForm.modelo} onChange={(e) => setVeiculoForm((p) => ({ ...p, modelo: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Marca</Label>
                      <Input value={veiculoForm.marca} onChange={(e) => setVeiculoForm((p) => ({ ...p, marca: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Placa</Label>
                      <Input value={veiculoForm.placa} onChange={(e) => setVeiculoForm((p) => ({ ...p, placa: e.target.value.toUpperCase() }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Responsavel</Label>
                      <Input value={veiculoForm.responsavel} onChange={(e) => setVeiculoForm((p) => ({ ...p, responsavel: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="submit">{editingVeiculoId ? "Salvar Alteracoes" : "Cadastrar Veiculo"}</Button>
                    {editingVeiculoId && <Button type="button" variant="outline" onClick={resetVeiculoForm}>Cancelar</Button>}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}






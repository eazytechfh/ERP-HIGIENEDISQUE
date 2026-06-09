'use client'

import { useEffect, useState } from "react"
import { useAccess } from "@/components/access-provider"
import { ErpHeader } from "@/components/erp-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDefaultPermissionsForRole, PERMISSION_SECTIONS, type AppPermissionKey } from "@/lib/access-control"
import { safeAuditLogSupabase } from "@/lib/supabase/audit-log-repo"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  deleteEquipeMembroSupabase,
  listEquipeMembrosSupabase,
  upsertEquipeMembroSupabase,
  type EquipeMembroInput,
  type EquipeRole,
} from "@/lib/supabase/equipe-repo"
import { upsertUserAccessProfileSupabase } from "@/lib/supabase/profiles-repo"
import { Edit, Search, Trash2, UserPlus, Users } from "lucide-react"

type FormData = EquipeMembroInput & {
  criarLogin: boolean
  senhaAcesso: string
  confirmarSenhaAcesso: string
}

const INITIAL_FORM_DATA: FormData = {
  nome: "",
  telefone: "",
  cargo: "",
  endereco: "",
  cpf: "",
  cnh: "Nao",
  cnhValidade: "",
  nr33Validade: "",
  nr35Validade: "",
  asoValidade: "",
  feriasVencimento: "",
  situacao: "Ativo",
  emailAcesso: "",
  perfilAcesso: "",
  permissions: [],
  criarLogin: false,
  senhaAcesso: "",
  confirmarSenhaAcesso: "",
}

export default function EquipePage() {
  const { can, refreshProfile } = useAccess()
  const [membros, setMembros] = useState<EquipeMembroInput[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("visualizar")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canManageAccess = can("equipe.manage_access")
  const accessEnabled = Boolean(formData.criarLogin || formData.emailAcesso || formData.userId)

  const loadMembros = async () => {
    setLoading(true)
    try {
      const data = await listEquipeMembrosSupabase()
      setMembros(data)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Falha ao carregar equipe no Supabase.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMembros()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setFormData(INITIAL_FORM_DATA)
    setActiveTab("visualizar")
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "cnh" && value === "Nao" ? { cnhValidade: "" } : {}),
      ...(field === "emailAcesso" && !value
        ? {
            criarLogin: false,
            perfilAcesso: "",
            permissions: [],
            senhaAcesso: "",
            confirmarSenhaAcesso: "",
          }
        : {}),
      ...(field === "perfilAcesso" && typeof value === "string" && value
        ? {
            permissions: getDefaultPermissionsForRole(value as EquipeRole),
          }
        : {}),
    }))
  }

  const handlePermissionToggle = (permission: AppPermissionKey, checked: boolean) => {
    setFormData((prev) => {
      const currentPermissions = Array.isArray(prev.permissions) ? prev.permissions : []
      return {
        ...prev,
        permissions: checked
          ? Array.from(new Set([...currentPermissions, permission]))
          : currentPermissions.filter((item) => item !== permission),
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitSuccess("")
    setIsSubmitting(true)

    try {
      let userId = formData.userId
      let emailAcesso = formData.emailAcesso.trim().toLowerCase()
      let perfilAcesso = formData.perfilAcesso
      let permissions = (formData.permissions || []) as AppPermissionKey[]
      let createdAuth = false

      if (accessEnabled && !userId) {
        if (!canManageAccess) {
          throw new Error("Somente administradores podem criar ou configurar acessos de usuario.")
        }

        if (!emailAcesso) {
          throw new Error("Preencha o email de acesso para criar o login.")
        }

        if (formData.senhaAcesso.length < 6) {
          throw new Error("A senha de acesso deve ter ao menos 6 caracteres.")
        }

        if (formData.senhaAcesso !== formData.confirmarSenhaAcesso) {
          throw new Error("A confirmacao da senha nao confere.")
        }

        if (!perfilAcesso) {
          throw new Error("Selecione o perfil de acesso do usuario.")
        }

        const supabase = getSupabaseBrowserClient()
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !sessionData.session?.access_token) {
          throw new Error("Sessao admin do Supabase indisponivel. Entre com um administrador real para criar usuarios.")
        }

        const response = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            email: emailAcesso,
            password: formData.senhaAcesso,
            nome: formData.nome.trim(),
            role: perfilAcesso,
            permissions,
          }),
        })

        const payload = (await response.json()) as {
          error?: string
          user?: { id: string; email?: string; role?: EquipeRole; permissions?: AppPermissionKey[] }
        }

        if (!response.ok || !payload.user) {
          throw new Error(payload.error || "Falha ao criar usuario no Supabase Auth.")
        }

        userId = payload.user.id
        emailAcesso = payload.user.email || emailAcesso
        perfilAcesso = payload.user.role || perfilAcesso
        permissions = payload.user.permissions || permissions
        createdAuth = true
      }

      if (userId && canManageAccess && perfilAcesso) {
        await upsertUserAccessProfileSupabase({
          userId,
          nome: formData.nome.trim(),
          role: perfilAcesso,
          ativo: formData.situacao === "Ativo",
          permissions,
        })
      }

      const saved = await upsertEquipeMembroSupabase({
        id: editingId || undefined,
        userId,
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        cargo: formData.cargo.trim(),
        endereco: formData.endereco.trim(),
        cpf: formData.cpf.trim(),
        cnh: formData.cnh,
        cnhValidade: formData.cnhValidade,
        nr33Validade: formData.nr33Validade,
        nr35Validade: formData.nr35Validade,
        asoValidade: formData.asoValidade,
        situacao: formData.situacao,
        emailAcesso,
        perfilAcesso: perfilAcesso || "",
        permissions,
      })
      const savedWithPermissions: EquipeMembroInput = {
        ...saved,
        userId,
        emailAcesso,
        perfilAcesso: perfilAcesso || "",
        permissions,
      }

      if (userId && canManageAccess && perfilAcesso) {
        await safeAuditLogSupabase({
          action: createdAuth ? "create" : "update",
          entity: "user_access",
          entityId: userId,
          entityLabel: formData.nome.trim(),
          description: createdAuth ? "Usuario criado com permissoes personalizadas." : "Permissoes de usuario atualizadas.",
          metadata: {
            role: perfilAcesso,
            permissions,
            ativo: formData.situacao === "Ativo",
          },
        })
      }

      setMembros((prev) => {
        const exists = prev.some((item) => item.id === savedWithPermissions.id || (savedWithPermissions.userId && item.userId === savedWithPermissions.userId))
        return exists
          ? prev.map((item) => (item.id === savedWithPermissions.id || (savedWithPermissions.userId && item.userId === savedWithPermissions.userId) ? savedWithPermissions : item))
          : [savedWithPermissions, ...prev]
      })

      await refreshProfile()
      setSubmitSuccess(createdAuth ? "Membro salvo e usuario criado no Supabase com sucesso." : "Membro salvo no Supabase com sucesso.")
      setEditingId(null)
      setFormData(INITIAL_FORM_DATA)
      setActiveTab("visualizar")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Nao foi possivel salvar o membro.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (membro: EquipeMembroInput) => {
    setSubmitError("")
    setSubmitSuccess("")
    setEditingId(membro.id || null)
    setFormData({
      ...membro,
      permissions: Array.isArray(membro.permissions)
        ? membro.permissions
        : membro.perfilAcesso
          ? getDefaultPermissionsForRole(membro.perfilAcesso)
          : [],
      criarLogin: Boolean(membro.emailAcesso || membro.userId),
      senhaAcesso: "",
      confirmarSenhaAcesso: "",
    })
    setActiveTab("cadastrar")
  }

  const handleDelete = async (membro: EquipeMembroInput) => {
    if (!membro.id) return
    if (!window.confirm(`Deseja excluir ${membro.nome}?`)) return

    setSubmitError("")
    setSubmitSuccess("")

    try {
      await deleteEquipeMembroSupabase(membro.id)
      setMembros((prev) => prev.filter((item) => item.id !== membro.id))
      if (editingId === membro.id) resetForm()
      setSubmitSuccess("Membro removido do Supabase com sucesso.")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Falha ao excluir membro.")
    }
  }

  const filteredMembros = membros.filter((membro) => {
    const query = searchTerm.toLowerCase()
    return (
      membro.nome.toLowerCase().includes(query) ||
      membro.telefone.toLowerCase().includes(query) ||
      membro.cargo.toLowerCase().includes(query) ||
      membro.cpf.toLowerCase().includes(query) ||
      membro.emailAcesso.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Cadastro de Equipe</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="visualizar">Equipe Cadastrada</TabsTrigger>
            <TabsTrigger value="cadastrar">Cadastrar Novo Membro</TabsTrigger>
          </TabsList>

          <TabsContent value="visualizar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Membros da Equipe</CardTitle>
                <CardDescription>Somente dados carregados do Supabase aparecem nesta lista.</CardDescription>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome, telefone, CPF, cargo ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {submitError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}

                {submitSuccess ? (
                  <Alert className="mb-4">
                    <AlertDescription>{submitSuccess}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Telefone</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Cargo</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Endereco</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Férias</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Acesso</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Situacao</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">Acoes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Carregando equipe do Supabase...</td>
                          </tr>
                        ) : filteredMembros.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum membro encontrado no Supabase.</td>
                          </tr>
                        ) : (
                          filteredMembros.map((membro) => (
                            <tr key={membro.id || membro.userId} className="hover:bg-muted/50">
                              <td className="px-4 py-3 font-medium">{membro.nome}</td>
                              <td className="px-4 py-3">{membro.telefone}</td>
                              <td className="px-4 py-3">{membro.cargo}</td>
                              <td className="px-4 py-3 text-sm">{membro.endereco}</td>
                              <td className="px-4 py-3 text-sm">
                                {membro.feriasVencimento
                                  ? new Date(`${membro.feriasVencimento}T00:00:00`).toLocaleDateString("pt-BR")
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {membro.emailAcesso ? (
                                  <div className="space-y-1">
                                    <Badge variant="secondary">Com login</Badge>
                                    <div className="text-xs text-muted-foreground">{membro.emailAcesso}</div>
                                    <div className="text-xs uppercase text-muted-foreground">{membro.perfilAcesso}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {membro.permissions?.length || 0} permissoes
                                    </div>
                                  </div>
                                ) : (
                                  <Badge variant="outline">Sem login</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={membro.situacao === "Ativo" ? "default" : "secondary"}>{membro.situacao}</Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEdit(membro)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => void handleDelete(membro)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">Total de membros: {filteredMembros.length}</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cadastrar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  {editingId ? "Editar Membro" : "Cadastrar Novo Membro"}
                </CardTitle>
                <CardDescription>O cadastro so e concluido quando o registro for salvo no Supabase.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {submitError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  ) : null}

                  {submitSuccess ? (
                    <Alert>
                      <AlertDescription>{submitSuccess}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input id="nome" value={formData.nome} onChange={(e) => handleInputChange("nome", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input id="telefone" value={formData.telefone} onChange={(e) => handleInputChange("telefone", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input id="cpf" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo *</Label>
                      <Input id="cargo" value={formData.cargo} onChange={(e) => handleInputChange("cargo", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnh">CNH</Label>
                      <Select value={formData.cnh} onValueChange={(value) => handleInputChange("cnh", value as "Sim" | "Nao")}>
                        <SelectTrigger id="cnh"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sim">Sim</SelectItem>
                          <SelectItem value="Nao">Nao</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.cnh === "Sim" ? (
                      <div className="space-y-2">
                        <Label htmlFor="cnhValidade">Validade da CNH *</Label>
                        <Input id="cnhValidade" type="date" value={formData.cnhValidade} onChange={(e) => handleInputChange("cnhValidade", e.target.value)} required />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor="situacao">Situacao *</Label>
                      <Select value={formData.situacao} onValueChange={(value) => handleInputChange("situacao", value as "Ativo" | "Inativo")}>
                        <SelectTrigger id="situacao"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="endereco">Endereco Completo *</Label>
                      <Input id="endereco" value={formData.endereco} onChange={(e) => handleInputChange("endereco", e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-foreground">Treinamentos e Validades</h3>
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="nr33">NR33 - Validade</Label>
                        <Input id="nr33" type="date" value={formData.nr33Validade} onChange={(e) => handleInputChange("nr33Validade", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nr35">NR35 - Validade</Label>
                        <Input id="nr35" type="date" value={formData.nr35Validade} onChange={(e) => handleInputChange("nr35Validade", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aso">ASO - Validade</Label>
                        <Input id="aso" type="date" value={formData.asoValidade} onChange={(e) => handleInputChange("asoValidade", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="feriasVencimento">Vencimento das Férias</Label>
                        <Input id="feriasVencimento" type="date" value={formData.feriasVencimento || ""} onChange={(e) => handleInputChange("feriasVencimento", e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border bg-background p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">Acesso ao sistema</h3>
                        <p className="text-sm text-muted-foreground">Se preencher email e perfil, o usuario tambem sera criado no Supabase Auth.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Label htmlFor="temAcesso" className="text-sm">Criar login</Label>
                        <Switch
                          id="temAcesso"
                          checked={accessEnabled}
                          disabled={Boolean(formData.userId) || !canManageAccess}
                          onCheckedChange={(checked) => {
                            handleInputChange("criarLogin", checked)
                            if (!checked) {
                              handleInputChange("emailAcesso", "")
                            }
                          }}
                        />
                      </div>
                    </div>

                    {!canManageAccess ? (
                      <Alert>
                        <AlertDescription>Somente administradores podem criar usuarios e alterar permissoes de acesso.</AlertDescription>
                      </Alert>
                    ) : null}

                    {formData.userId ? (
                      <Alert>
                        <AlertDescription>Este membro ja possui usuario vinculado no Supabase Auth.</AlertDescription>
                      </Alert>
                    ) : null}

                    {accessEnabled ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="emailAcesso">Email de acesso *</Label>
                          <Input id="emailAcesso" type="email" value={formData.emailAcesso} onChange={(e) => handleInputChange("emailAcesso", e.target.value)} disabled={Boolean(formData.userId)} required={accessEnabled} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perfilAcesso">Perfil de acesso *</Label>
                          <Select
                            value={formData.perfilAcesso || "operacional"}
                            onValueChange={(value) => handleInputChange("perfilAcesso", value as EquipeRole)}
                            disabled={!canManageAccess}
                          >
                            <SelectTrigger id="perfilAcesso"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="operacional">Operacional</SelectItem>
                              <SelectItem value="financeiro">Financeiro</SelectItem>
                              <SelectItem value="tecnico">Tecnico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {!formData.userId ? (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="senhaAcesso">Senha provisoria *</Label>
                              <Input id="senhaAcesso" type="password" value={formData.senhaAcesso} onChange={(e) => handleInputChange("senhaAcesso", e.target.value)} required={accessEnabled && !Boolean(formData.userId)} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmarSenhaAcesso">Confirmar senha *</Label>
                              <Input id="confirmarSenhaAcesso" type="password" value={formData.confirmarSenhaAcesso} onChange={(e) => handleInputChange("confirmarSenhaAcesso", e.target.value)} required={accessEnabled && !Boolean(formData.userId)} />
                            </div>
                          </>
                        ) : null}
                      </div>
                    ) : null}

                    {accessEnabled && canManageAccess && formData.perfilAcesso ? (
                      <div className="space-y-4 rounded-md border border-dashed p-4">
                        <div>
                          <h4 className="text-sm font-semibold">Permissoes detalhadas</h4>
                          <p className="text-sm text-muted-foreground">
                            O administrador pode ajustar visualizacao e acoes disponiveis para esse usuario.
                          </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          {PERMISSION_SECTIONS.map((section) => (
                            <div key={section.title} className="space-y-3 rounded-md border p-3">
                              <p className="text-sm font-medium">{section.title}</p>
                              <div className="space-y-2">
                                {section.items.map((item) => (
                                  <label key={item.key} className="flex items-center gap-3 text-sm">
                                    <Checkbox
                                      checked={(formData.permissions || []).includes(item.key)}
                                      onCheckedChange={(checked) => handlePermissionToggle(item.key, checked === true)}
                                    />
                                    <span>{item.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : editingId ? "Atualizar Membro" : "Cadastrar Membro"}</Button>
                    {editingId ? (
                      <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancelar</Button>
                    ) : null}
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


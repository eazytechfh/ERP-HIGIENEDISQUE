"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ErpHeader } from "@/components/erp-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { listAuditLogsSupabase, type AuditLogItem } from "@/lib/supabase/audit-log-repo"
import { FileText, Search } from "lucide-react"

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const rows = await listAuditLogsSupabase()
        setLogs(rows)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar os logs.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return logs

    return logs.filter((log) =>
      [
        log.actorNome,
        log.actorEmail,
        log.action,
        log.entity,
        log.entityLabel,
        log.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    )
  }, [logs, search])

  return (
    <div className="min-h-screen bg-muted/30">
      <ErpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Logs de Auditoria</h1>
            <p className="text-sm text-muted-foreground">Visualizacao restrita ao administrador para acompanhamento das acoes do sistema.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historico de acoes</CardTitle>
            <CardDescription>
              Registra cadastros, edicoes, exclusoes e geracao de documentos nos principais modulos.
            </CardDescription>
            <div className="relative mt-4 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por usuario, acao, modulo ou descricao..."
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Quando</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Usuario</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Acao</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Modulo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Descricao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          Carregando logs...
                        </td>
                      </tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          Nenhum log encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="align-top hover:bg-muted/40">
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {log.createdAt
                              ? format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium">{log.actorNome || "Usuario"}</div>
                            <div className="text-muted-foreground">{log.actorEmail || "-"}</div>
                          </td>
                          <td className="px-4 py-3 text-sm uppercase">{log.action}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium">{log.entity}</div>
                            <div className="text-muted-foreground">{log.entityLabel || log.entityId || "-"}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>{log.description}</div>
                            {log.metadata ? (
                              <pre className="mt-2 whitespace-pre-wrap rounded bg-muted p-2 text-xs text-muted-foreground">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

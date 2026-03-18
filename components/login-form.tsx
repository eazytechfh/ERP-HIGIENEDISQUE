"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { findLocalTestUser } from "@/lib/local-test-users"
import { Eye, EyeOff, Shield } from "lucide-react"
import { isApiMode } from "@/lib/runtime-config"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { withTimeout } from "@/lib/with-timeout"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (isApiMode()) {
        const supabase = getSupabaseBrowserClient()
        const { error: signInError } = await withTimeout(
          supabase.auth.signInWithPassword({
            email,
            password,
          }),
          10000,
          "Tempo esgotado ao tentar entrar. Tente novamente.",
        )

        if (signInError) {
          setError(signInError.message || "Falha no login. Verifique email e senha.")
          return
        }

        const { data: sessionData, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          "Tempo esgotado ao confirmar a sessao de acesso.",
        )

        if (sessionError || !sessionData.session) {
          setError("Login efetuado, mas a sessao nao foi confirmada. Tente novamente.")
          return
        }

        window.location.href = "/dashboard"
        return
      }

      if (email === "admin@higienedisque.com.br" && password === "Admin123@") {
        window.location.href = "/dashboard"
        return
      }

      const localUser = findLocalTestUser(email, password)
      if (localUser) {
        window.location.href = "/dashboard"
        return
      }

      setError("Usuario ou senha incorretos. Tente novamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel concluir o login.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">HIGIENE DISQUE</h1>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-balance">Bem-vindo de volta</h2>
        <p className="text-muted-foreground">Acesse sua conta para gerenciar seus servicos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {!isApiMode() && process.env.NODE_ENV !== "production" && (
            <div className="mt-6 border-t pt-6">
              <div className="text-center text-sm text-muted-foreground">
                <p className="mb-2">Credenciais de teste (modo local):</p>
                <div className="space-y-1">
                  <p className="font-mono text-xs">
                    <span className="font-semibold">Email:</span> admin@higienedisque.com.br
                  </p>
                  <p className="font-mono text-xs">
                    <span className="font-semibold">Senha:</span> Admin123@
                  </p>
                  <p className="pt-2 text-xs">
                    Usuarios criados em Equipe com acesso ao sistema tambem podem entrar por aqui no modo local.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">Problemas para acessar? Entre em contato com o suporte</p>
    </div>
  )
}

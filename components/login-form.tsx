'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Shield } from 'lucide-react'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate login validation
    setTimeout(() => {
      if (username === 'Admin' && password === 'Admin123@') {
        // Success - redirect to dashboard (placeholder)
        window.location.href = '/dashboard'
      } else {
        setError('Usuário ou senha incorretos. Tente novamente.')
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">HIGIENE DISQUE</h1>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-balance">Bem-vindo de volta</h2>
        <p className="text-muted-foreground">
          Acesse sua conta para gerenciar seus serviços
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground text-center">
              <p className="mb-2">Credenciais de teste:</p>
              <div className="space-y-1">
                <p className="font-mono text-xs">
                  <span className="font-semibold">Usuário:</span> Admin
                </p>
                <p className="font-mono text-xs">
                  <span className="font-semibold">Senha:</span> Admin123@
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Problemas para acessar? Entre em contato com o suporte
      </p>
    </div>
  )
}

import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_40%)]" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-balance">HIGIENE DISQUE</h1>
            <p className="text-lg text-primary-foreground/90">Sistema ERP</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-balance leading-tight">
                Gestão completa para sua empresa
              </h2>
              <p className="text-lg text-primary-foreground/80">
                Controle de serviços, clientes, agendamentos e muito mais em uma única plataforma moderna e eficiente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <div className="text-3xl font-bold">34+</div>
                <div className="text-sm text-primary-foreground/70">Anos de experiência</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">100%</div>
                <div className="text-sm text-primary-foreground/70">Digital e seguro</div>
              </div>
            </div>
          </div>

          <div className="text-sm text-primary-foreground/60">
            © 2025 Higiene Disque - Todos os direitos reservados
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from 'lucide-react'
import { useState } from "react"

const navigation = [
  { name: "Dashboard Principal", href: "/dashboard" },
  { name: "Clientes", href: "/dashboard/clientes" },
  { name: "Histórico de Serviços", href: "/dashboard/historico" },
  { name: "Cadastro de Serviços", href: "/dashboard/servicos" },
  { name: "Estoque", href: "/dashboard/produtos" },
  { name: "Cadastro Equipe", href: "/dashboard/equipe" },
  { name: "Veiculos", href: "/dashboard/veiculos" },
  { name: "Financeiro", href: "/dashboard/financeiro" },
]

export function ErpHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">HD</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-foreground">HIGIENE DISQUE</h1>
              <p className="text-xs text-muted-foreground">Sistema ERP</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 space-y-1 border-t">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}




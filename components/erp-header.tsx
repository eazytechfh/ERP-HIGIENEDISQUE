"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { LogOut, Menu, ChevronDown, Users, Briefcase } from 'lucide-react'
import { useState } from "react"

type NavItem = {
  name: string
  href: string
  children?: { name: string; href: string }[]
}

const navigation: NavItem[] = [
  { name: "Dashboard Principal", href: "/dashboard" },
  { 
    name: "Clientes", 
    href: "/dashboard/clientes",
    children: [
      { name: "Lista de Clientes", href: "/dashboard/clientes" },
      { name: "Contratos", href: "/dashboard/clientes/contratos" },
    ]
  },
  { 
    name: "Servicos", 
    href: "/dashboard/servicos",
    children: [
      { name: "Cadastro de Servicos", href: "/dashboard/servicos" },
      { name: "Servicos Agendados", href: "/dashboard/servicos/agendados" },
      { name: "Historico de Servicos", href: "/dashboard/historico" },
    ]
  },
  { name: "Estoque", href: "/dashboard/produtos" },
  { name: "Cadastro Equipe", href: "/dashboard/equipe" },
  { name: "Financeiro", href: "/dashboard/financeiro" },
]

export function ErpHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const isActiveRoute = (item: NavItem) => {
    if (pathname === item.href) return true
    if (item.children) {
      return item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))
    }
    return pathname.startsWith(item.href + '/')
  }

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
              item.children ? (
                <DropdownMenu key={item.href}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1",
                        isActiveRoute(item)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {item.name}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link
                          href={child.href}
                          className={cn(
                            "w-full cursor-pointer",
                            pathname === child.href && "bg-muted"
                          )}
                        >
                          {child.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActiveRoute(item)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.name}
                </Link>
              )
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
              <div key={item.href}>
                {item.children ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActiveRoute(item)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {item.name}
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        openDropdown === item.name && "rotate-180"
                      )} />
                    </button>
                    {openDropdown === item.name && (
                      <div className="pl-4 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                              pathname === child.href
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActiveRoute(item)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

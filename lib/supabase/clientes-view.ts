"use client"

import type { ClienteInput } from "@/lib/supabase/clientes-repo"

export type ClienteResumoView = {
  id: string
  nome: string
  cpfCnpj: string
  tipo: "PF" | "PJ"
  status: string
  telefone: string
  email: string
}

export type ClienteServicoView = {
  id: string
  nome: string
  telefone: string
  email: string
  empresa: string
  cpfCnpj: string
}

export type ClienteLocalView = {
  id: string
  nome: string
  cep: string
  endereco: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
}

export function mapClienteToResumoView(c: ClienteInput): ClienteResumoView {
  return {
    id: String(c.id),
    nome: c.nome || "Cliente",
    cpfCnpj: c.cnpj || c.cpf || "",
    tipo: c.tipoCliente === "pj" ? "PJ" : "PF",
    status: c.status || "Ativo",
    telefone: c.telefone || "",
    email: c.email || "",
  }
}

export function mapClienteToServicoView(c: ClienteInput): ClienteServicoView {
  return {
    id: String(c.id),
    nome: c.nome || "Cliente",
    telefone: c.telefone || "",
    email: c.email || "",
    empresa: c.nomeFantasia || c.nome || "",
    cpfCnpj: c.cnpj || c.cpf || "",
  }
}

export function buildLocaisPorCliente(clientes: ClienteInput[]): Record<string, ClienteLocalView[]> {
  const mapped: Record<string, ClienteLocalView[]> = {}
  clientes.forEach((c) => {
    mapped[String(c.id)] = (c.locais || []).map((l, idx) => ({
      id: String(l.id || `${c.id}-loc-${idx}`),
      nome: l.nome || "Local",
      cep: l.cep || "",
      endereco: l.endereco || "",
      numero: l.numero || "",
      complemento: l.complemento || "",
      bairro: l.bairro || "",
      cidade: l.cidade || "",
      estado: l.estado || "",
    }))
  })
  return mapped
}

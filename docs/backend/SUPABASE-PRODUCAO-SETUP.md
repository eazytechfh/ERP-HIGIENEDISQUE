# Supabase Produ??o - Setup

## 1) Vari?veis de ambiente
Foi criado localmente:
- `.env.production.local`

Tamb?m foi criado um template versionado:
- `env.example`

## 2) Executar schema inicial
No Supabase (SQL Editor), execute o conte?do de:
- `supabase/migrations/20260310_001_init_schema.sql`

Esse script cria:
- tabelas principais (`profiles`, `clientes`, `contratos`, `contrato_itens`, `servicos`, `servico_responsaveis`, `produtos`)
- fun??es de autoriza??o por perfil
- RLS/policies
- buckets privados (`os-documentos`, `contratos-docx`) e policies de storage

## 3) Criar usu?rio admin inicial
Ap?s criar um usu?rio no Auth (email/senha), execute no SQL Editor:

```sql
insert into public.profiles (user_id, nome, role)
values ('<USER_ID_AUTH_USERS>', 'Administrador', 'admin')
on conflict (user_id) do update set role = excluded.role, nome = excluded.nome;
```

## 4) Reset de senha por email
No painel Supabase:
- Auth -> Providers -> Email: habilitado
- Auth -> URL Configuration: configurar URLs de redirecionamento da aplica??o

## 5) Observa??o de seguran?a
As chaves foram compartilhadas no chat. Recomendado:
- Rotacionar `anon` e `service_role` ao finalizar a configura??o.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no frontend.

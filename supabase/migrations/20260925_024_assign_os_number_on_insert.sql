-- A numeracao passa a ser confirmada na mesma transacao que cria a OS.
-- Assim, cancelar a ultima etapa ou ocorrer uma falha de gravacao nao
-- consome um numero. Registros e numeros existentes nao sao alterados.

create or replace function public.assign_os_number_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer;
  v_next bigint;
begin
  if new.os_number is null or btrim(new.os_number) = '' then
    v_year := extract(year from timezone('America/Sao_Paulo', now()))::integer;

    insert into public.os_number_counters (year, last_number, updated_at)
    values (
      v_year,
      (
        select coalesce(
          max(substring(os_number from ('^OS-' || v_year::text || '-([0-9]+)$'))::bigint),
          0
        ) + 1
        from public.servicos
      ),
      now()
    )
    on conflict (year) do update
      set last_number = public.os_number_counters.last_number + 1,
          updated_at = now()
    returning last_number into v_next;

    new.os_number := 'OS-' || v_year::text || '-' || lpad(v_next::text, 6, '0');

    if new.os_documento_html is not null then
      new.os_documento_html := replace(new.os_documento_html, 'OS-PENDENTE', new.os_number);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_servicos_assign_os_number on public.servicos;
create trigger trg_servicos_assign_os_number
before insert on public.servicos
for each row execute function public.assign_os_number_on_insert();

-- Impede que telas antigas continuem consumindo numeros sem criar a OS.
revoke execute on function public.reserve_next_os_number(integer) from authenticated;

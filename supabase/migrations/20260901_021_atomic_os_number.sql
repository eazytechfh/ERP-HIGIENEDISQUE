create table if not exists public.os_number_counters (
  year integer primary key check (year between 2000 and 9999),
  last_number bigint not null check (last_number > 0),
  updated_at timestamptz not null default now()
);

alter table public.os_number_counters enable row level security;
revoke all on table public.os_number_counters from anon, authenticated;

create or replace function public.reserve_next_os_number(p_year integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next bigint;
begin
  if p_year is null or p_year < 2000 or p_year > 9999 then
    raise exception 'Ano invalido para numero de OS';
  end if;

  insert into public.os_number_counters (year, last_number, updated_at)
  values (
    p_year,
    (
      select coalesce(
        max(substring(os_number from ('^OS-' || p_year::text || '-([0-9]+)$'))::bigint),
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

  return 'OS-' || p_year::text || '-' || lpad(v_next::text, 6, '0');
end;
$$;

revoke all on function public.reserve_next_os_number(integer) from public, anon;
grant execute on function public.reserve_next_os_number(integer) to authenticated;

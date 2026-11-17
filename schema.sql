-- Pegá esto en Supabase > SQL Editor > Run
create table public.licenses (
  code text primary key,
  client_ref text,
  device_id text,
  activated_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.licenses enable row level security; -- sin políticas: solo la función accede

-- Crear un código para un cliente (usá códigos largos y al azar):
--   insert into public.licenses (code, client_ref) values ('MP-7K2Q-X9PD-4WLM', 'Laura');
-- Anular:           update public.licenses set revoked = true where code = 'MP-7K2Q-X9PD-4WLM';
-- Liberar el equipo (cliente cambió de celular): update public.licenses set device_id = null where code = 'MP-7K2Q-X9PD-4WLM';

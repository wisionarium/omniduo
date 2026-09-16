-- v2: login Meta antes do Supabase Auth.
-- A conexão Meta (fb_user_id) passa a ser a identidade primária;
-- o vínculo com profiles.user_id acontece depois (quando o Auth por email entrar).
alter table public.meta_connections
  alter column user_id drop not null;

create unique index if not exists meta_connections_fb_user_id_uidx
  on public.meta_connections (fb_user_id);

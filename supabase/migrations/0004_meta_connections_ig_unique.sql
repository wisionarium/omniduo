-- v4: identidade via Instagram (Business Login não retorna fb_user_id).
create unique index if not exists meta_connections_ig_user_id_uidx
  on public.meta_connections (ig_id) where ig_id is not null;

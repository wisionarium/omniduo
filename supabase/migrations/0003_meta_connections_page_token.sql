-- v3: token da Page (envio de DMs) + flag de assinatura do webhook.
alter table public.meta_connections
  add column if not exists page_token_encrypted text,
  add column if not exists webhook_subscribed boolean not null default false;

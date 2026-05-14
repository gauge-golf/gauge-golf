-- Gauge Golf · lead capture
-- Run once: psql "$DATABASE_URL" -f lib/schema.sql

create table if not exists leads (
  id          bigserial primary key,
  name        text        not null,
  email       text        not null,
  country     text        not null,
  social      text,
  handicap    text,
  volume      text,
  message     text,
  user_agent  text,
  referer     text,
  created_at  timestamptz not null default now()
);

create unique index if not exists leads_email_idx on leads (lower(email));
create index        if not exists leads_created_idx on leads (created_at desc);

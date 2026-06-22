-- Gauge Golf · passwordless auth (email + OTP)
-- Run once: psql "$DATABASE_URL" -f lib/migrations/004_auth.sql

-- Users get a friendly id like GG-48291.
create table if not exists users (
  id         text primary key,
  email      text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists users_email_idx on users (lower(email));

-- Short-lived one-time codes (hashed). Verified codes are marked consumed.
create table if not exists otp_codes (
  id         bigserial primary key,
  email      text        not null,
  code_hash  text        not null,
  expires_at timestamptz not null,
  consumed   boolean     not null default false,
  created_at timestamptz not null default now()
);
create index if not exists otp_codes_email_idx on otp_codes (lower(email), created_at desc);

-- Link existing sessions to a user (nullable; anonymous sessions stay null).
alter table coach_sessions add column if not exists user_id text references users(id);
create index if not exists coach_sessions_user_idx on coach_sessions (user_id, created_at desc);

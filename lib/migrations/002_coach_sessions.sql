-- Gauge Golf · coach session tracking
-- Run once: psql "$DATABASE_URL" -f lib/migrations/002_coach_sessions.sql

create table if not exists coach_sessions (
  id                 bigserial primary key,
  practice_type      text,
  total_balls        integer,
  duration_secs      integer,
  practice_score     integer,
  primary_limitation text,
  next_goal          text,
  session_feeling    text,        -- weak | normal | strong | very_strong
  user_agent         text,
  referer            text,
  created_at         timestamptz not null default now()
);

create index if not exists coach_sessions_created_idx on coach_sessions (created_at desc);

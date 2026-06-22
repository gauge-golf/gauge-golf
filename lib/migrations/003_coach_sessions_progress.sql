-- Gauge Golf · coach session progress + records
-- Adds anonymous per-device tracking and per-club stats for personal records.
-- Run once: psql "$DATABASE_URL" -f lib/migrations/003_coach_sessions_progress.sql

alter table coach_sessions add column if not exists client_id       text;
alter table coach_sessions add column if not exists clubs_practiced integer;
alter table coach_sessions add column if not exists club_stats      jsonb;

create index if not exists coach_sessions_client_idx on coach_sessions (client_id, created_at desc);

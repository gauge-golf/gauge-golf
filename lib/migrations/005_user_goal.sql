-- Gauge Golf · player goal (profile-level, captured once at registration)
-- Run once: psql "$DATABASE_URL" -f lib/migrations/005_user_goal.sql

-- goal is one of: consistency | lower_handicap | distance | general
alter table users add column if not exists goal text;
-- optional target handicap (e.g. 10) — only meaningful for lower_handicap goals
alter table users add column if not exists target_handicap int;

-- Gauge Golf · per-player, per-club yardage profiles
-- Silently built from every completed session — the foundation for the Yardage Book,
-- AI adaptive plans, and club-distance recommendations.
-- Run once: node --env-file=.env.local scripts/migrate.mjs lib/migrations/007_club_profiles.sql

create table if not exists club_profiles (
  profile_key     text primary key,           -- "user:{id}:{club}" | "anon:{clientId}:{club}"
  user_id         text references users(id),
  client_id       text,
  club_key        text not null,              -- club abbreviation: SW, PW, 9I … DR
  avg_distance    integer not null default 0, -- m, weighted rolling average across sessions
  reliable_dist   integer not null default 0, -- m, conservative carry (avg - spread)
  personal_best   integer not null default 0, -- m, all-time best shot
  accuracy        integer not null default 0, -- %, weighted center-hit average
  dispersion      integer not null default 0, -- m, avg within-session std deviation
  session_count   integer not null default 0,
  total_shots     integer not null default 0,
  last_updated_at timestamptz not null default now()
);

create index if not exists club_profiles_user_idx   on club_profiles (user_id)   where user_id   is not null;
create index if not exists club_profiles_client_idx on club_profiles (client_id) where client_id is not null;

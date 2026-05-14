-- Migration · adds country breakdown + glove fit fields.
-- Idempotent. Run with: psql "$DATABASE_URL" -f lib/migrations/001_add_state_hand_size.sql

alter table leads add column if not exists state       text;
alter table leads add column if not exists hand        text;
alter table leads add column if not exists glove_size  text;

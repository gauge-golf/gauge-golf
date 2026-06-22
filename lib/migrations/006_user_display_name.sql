-- Gauge Golf · editable display name (shown in UI + share card)
-- Run once: psql "$DATABASE_URL" -f lib/migrations/006_user_display_name.sql

-- Friendly name a player can set (e.g. "Konstantin K."). The GG-xxxxx id
-- stays as the stable internal identifier; this is purely for display.
alter table users add column if not exists display_name text;

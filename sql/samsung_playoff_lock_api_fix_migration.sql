-- Samsung JalkaMM 2026: play-off edasipääseja, kick-off lukk ja API-Football tulemuste väljad
-- Käivita ainult Samsungi Supabase projektis.
-- Ei kustuta olemasolevaid kasutajaid ega ennustusi.

alter table public.matches
  add column if not exists went_extra boolean not null default false,
  add column if not exists status_short text,
  add column if not exists advancing_team text,
  add column if not exists api_football_fixture_id bigint;

alter table public.predictions
  add column if not exists advancing_team text;

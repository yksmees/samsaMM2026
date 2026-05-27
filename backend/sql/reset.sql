drop table if exists predictions cascade;
drop table if exists matches cascade;
drop table if exists players cascade;
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  password_hash text not null,
  role text not null default 'player' check (role in ('player','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id integer primary key,
  match_date date not null,
  match_time text not null,
  round text not null,
  group_name text,
  home text not null,
  away text not null,
  venue text,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled',
  locked boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists predictions (
  player_id uuid not null references players(id) on delete cascade,
  match_id integer not null references matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  updated_at timestamptz not null default now(),
  primary key (player_id, match_id)
);

create index if not exists idx_predictions_player on predictions(player_id);
create index if not exists idx_predictions_match on predictions(match_id);

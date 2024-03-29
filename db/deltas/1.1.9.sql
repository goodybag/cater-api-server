-- #599 Reminders/notifications

DO $$
  declare version       text := '1.1.9';

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "reminders" (
    id            serial primary key
  , created_at    timestamp not null default now()
  , name          text not null
  , data          json not null default '{}'
  );

end$$;

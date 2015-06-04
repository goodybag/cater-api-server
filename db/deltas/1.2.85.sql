-- Delta

DO $$
  declare version       text := '1.2.85';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  DROP TABLE IF EXISTS "stripe_events";
  CREATE TABLE IF NOT EXISTS "stripe_events" (
    id              serial primary key
  , created_at      timestamptz not null default now()
  , data            json not null
  );

end$$;

-- #599 Reminders/notifications

DO $$
  declare version       text := '1.1.10';

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Fix created_at for reminders table
  -- since production runs w/timezone GMT we don't need to update any rows
  ALTER TABLE reminders
    ALTER COLUMN created_at TYPE timestamptz
  ;

end$$;

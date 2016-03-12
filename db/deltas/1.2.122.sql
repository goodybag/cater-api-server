-- Delta

DO $$
  declare version       text := '1.2.122';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  ALTER TABLE items ADD COLUMN is_popular BOOLEAN NOT NULL DEFAULT FALSE;
end$$;

-- Delta

DO $$
  declare version       text := '1.2.79';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table restaurant_notes alter created_at type timestamptz;
end$$;

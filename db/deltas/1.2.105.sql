-- Delta

DO $$
  declare version       text := '1.2.105';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column('users', 'is_deleted', 'BOOLEAN NOT NULL DEFAULT FALSE');
end$$;

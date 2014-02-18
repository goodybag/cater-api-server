-- restaurant search

DO $$
  declare version       text := '1.1.13';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

end$$;

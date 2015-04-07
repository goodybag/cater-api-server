-- Delta

DO $$
  declare version       text := '1.2.73';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurant_locations', 'price_per_mile', 'int default 0' );
end$$;

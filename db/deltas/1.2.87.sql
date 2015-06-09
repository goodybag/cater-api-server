-- Add Lat and Lon

DO $$
  declare version       text := '1.2.87';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'lat_lon', 'point' );
  perform add_column( 'restaurant_locations', 'lat_lon', 'point' );
end$$;
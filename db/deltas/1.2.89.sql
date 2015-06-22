-- Add Lat and Lon

DO $$
  declare version       text := '1.2.89';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table orders drop column "lat_lon";
  alter table restaurant_locations drop column "lat_lon";

  perform add_column( 'orders', 'lat_lng', 'point' );
  perform add_column( 'restaurant_locations', 'lat_lng', 'point' );
  perform add_column( 'addresses', 'lat_lng', 'point' );
end$$;
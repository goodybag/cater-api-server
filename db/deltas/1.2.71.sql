-- Delta

DO $$
  declare version       text := '1.2.71';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'delivery_services', 'region_order_distribution', 'numeric( 5, 4 ) not null default 1.0' );
end$$;
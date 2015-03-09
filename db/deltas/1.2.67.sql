-- Delta

DO $$
  declare version       text := '1.2.67';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform drop_column( 'orders', 'promo_code' );
  perform drop_column( 'restaurants', 'promo_code' );
end$$;
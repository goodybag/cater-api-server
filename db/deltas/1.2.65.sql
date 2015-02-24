-- Delta

DO $$
  declare version       text := '1.2.65';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'promo_code', 'text default null');
  perform add_column( 'restaurants', 'promo_code', 'text default null');
end$$;
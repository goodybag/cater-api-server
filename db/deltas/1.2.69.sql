-- Delta

DO $$
  declare version       text := '1.2.69';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'users', 'stripe_id', 'text' );
  perform add_column( 'payment_methods', 'stripe_id', 'text' );
end$$;

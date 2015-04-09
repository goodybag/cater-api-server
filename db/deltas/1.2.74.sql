-- Delta

DO $$
  declare version       text := '1.2.74';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'users', 'stripe_id', 'text' );
  perform add_column( 'restaurants', 'stripe_id', 'text' );
  perform add_column( 'payment_methods', 'stripe_id', 'text' );

  execute 'alter table payment_methods alter column uri drop not null';
end$$;

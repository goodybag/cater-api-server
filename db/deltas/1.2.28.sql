-- Delta

DO $$
  declare version       text := '1.2.28';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'users_payment_methods', 'ordrin_card_id', 'text unique' );
end$$;
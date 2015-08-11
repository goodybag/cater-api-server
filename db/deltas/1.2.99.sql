-- Delta

DO $$
  declare version       text := '1.2.99';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column('restaurants', 'billing_bank', 'text');
  perform add_column('restaurants', 'billing_account_number', 'text');
  perform add_column('restaurants', 'billing_account_type', 'text');
  perform add_column('restaurants', 'billing_account_name', 'text');
end$$;
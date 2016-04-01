-- Delta

DO $$
  declare version       text := '1.2.127';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform drop_column( 'users', 'display_invoice_instead_of_order' );
end$$;

-- Delta

DO $$
  declare version       text := '1.2.120';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'users', 'display_invoice_instead_of_order', 'bool not null default false' );
end$$;
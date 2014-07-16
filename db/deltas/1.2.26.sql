-- Delta

DO $$
  declare version       text := '1.2.26';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'users', 'ordrin_email', 'text' );
  perform add_column( 'users', 'ordrin_password', 'text' );
end$$;
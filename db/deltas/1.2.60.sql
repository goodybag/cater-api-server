-- Delta

DO $$
  declare version       text := '1.2.60';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
  perform add_column( 'addresses', 'phone2', E'varchar(10) check ( phone2 SIMILAR TO \'[[:digit:]]{10}\' )' );
end$$;
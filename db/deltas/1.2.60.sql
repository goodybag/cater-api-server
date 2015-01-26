-- Delta

DO $$
  declare version       text := '1.2.61';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'secondary_contact_name', 'text' );
  perform add_column( 'orders', 'secondary_contact_phone', E'varchar(10) CHECK (phone SIMILAR TO \'[[:digit:]]{10}\')' );
end$$;
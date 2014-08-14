-- Delta

DO $$
  declare version       text := '1.2.32';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "restaurant_requests" ();

  perform add_column( 'restaurant_requests', 'id', 'serial' );
  perform add_column( 'restaurant_requests', 'contact_name', 'text' );
  perform add_column( 'restaurant_requests', 'contact_email', 'text' );
  perform add_column( 'restaurant_requests', 'contact_phone', E'varchar(10) check( contact_phone SIMILAR TO \'[[:digit:]]{10}\' )' );
  perform add_column( 'restaurant_requests', 'restaurant_name', 'text' );
end$$;
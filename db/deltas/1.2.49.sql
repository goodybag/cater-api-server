-- Delta

DO $$
  declare version       text := '1.2.49';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "restaurant_locations" ();

  perform add_column( 'restaurant_locations', 'id', 'serial primary key' );
  perform add_column( 'restaurant_locations', 'restaurant_id', 'int references restaurants("id") not null' );
  perform add_column( 'restaurant_locations', 'name', 'text' );
  perform add_column( 'restaurant_locations', 'street', 'text not null' );
  perform add_column( 'restaurant_locations', 'street2', 'text' );
  perform add_column( 'restaurant_locations', 'city', 'text not null' );
  perform add_column( 'restaurant_locations', 'state', 'varchar(2) not null' );
  perform add_column( 'restaurant_locations', 'zip', 'varchar(5) not null' );
  perform add_column( 'restaurant_locations', 'is_default', 'boolean not null default false' );
  perform add_column( 'restaurant_locations', 'phone', E'varchar(10) not null check( phone similar to \'[[:digit:]]{10}\' )' );

  perform add_column( 'orders', 'restaurant_location_id', 'int references restaurant_locations("id") on delete set null' );
end$$;
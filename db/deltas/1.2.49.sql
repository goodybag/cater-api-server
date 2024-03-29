-- Delta

DO $$
  declare version       text := '1.2.49';
  declare r             restaurants;
  declare o             orders;
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
  perform add_column( 'restaurant_locations', 'phone', E'varchar(10) check( phone similar to \'[[:digit:]]{10}\' )' );

  perform add_column( 'orders', 'restaurant_location_id', 'int references restaurant_locations("id") on delete set null' );

  -- Setup default locations for restaurants
  delete from restaurant_locations;
  for r in ( select * from restaurants left join addresses on restaurants.address_id = addresses.id )
  loop
    insert into restaurant_locations
      ( restaurant_id, name, street, street2, city, state, zip, is_default, phone ) values
      ( r.id, 'Main', r.street, r.street2, r.city, r.state, r.zip, true, r.display_phone );
  end loop;

  update orders set restaurant_location_id = (
    select id from restaurant_locations
      where restaurant_locations.restaurant_id = orders.restaurant_id
        and restaurant_locations.is_default is true
  );
end$$;
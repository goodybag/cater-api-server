-- Delta

DO $$
  declare version       text := '1.2.68';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurant_locations', 'coordinates', 'point' );

  create or replace table "point_to_point_distances" ();
  perform add_column( 'point_to_point_distances', 'p1', 'point not null' );
  perform add_column( 'point_to_point_distances', 'p2', 'point not null' );
  perform add_column( 'point_to_point_distances', 'distance', 'point not null' );

  create or replace table "couriers" ();
  perform add_column( 'couriers', 'id', 'serial primary key' );
  perform add_column( 'couriers', 'name', 'text' );
  perform add_column( 'couriers', 'delivery_base_fee', 'int not null default 0' );
  perform add_column( 'couriers', 'delivery_rate', 'numeric( 5, 5 ) not null default 0' );

  create or replace table "map_boundaries" ();
  perform add_column( 'map_boundaries', 'id', 'serial primary key');
  perform add_column( 'map_boundaries', 'shape', 'polygon not null' );

  create or replace table "restaurant_location_delivery_boundaries" ()
    inherits ("map_boundaries");

  perform add_column(
    'restaurant_location_delivery_boundaries'
  , 'restaurant_location_id'
  , 'int references restaurant_locations("id")'
  );

  create or replace table "restaurant_location_delivery_boundaries" ()
    inherits ("map_boundaries");

  perform add_column(
    'restaurant_location_delivery_boundaries'
  , 'restaurant_location_id'
  , 'int references restaurant_locations("id")'
  );

  create or replace table "courier_delivery_boundaries" ()
    inherits ("map_boundaries");

  perform add_column(
    'courier_delivery_boundaries'
  , 'courier_id'
  , 'int references couriers("id")'
  );
end$$;
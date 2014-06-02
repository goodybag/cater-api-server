-- #892 asap order part 2

DO $$
  declare version       text := '1.2.17';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurants', 'delivery_service_order_amount_threshold', 'int not null default 0' );

  perform add_column( 'orders', 'is_pickup', 'bool not null default false' );
  perform add_column( 'orders', 'delivery_service_id', 'int references delivery_services( id )' );

  perform add_column( 'delivery_services', 'lead_time_modifier', 'int not null default 0' );

  create table if not exists restaurant_pickup_lead_times ();
  perform add_column( 'restaurant_pickup_lead_times', 'id', 'serial primary key' );
  perform add_column( 'restaurant_pickup_lead_times', 'restaurant_id', 'int not null references restaurants(id) on delete cascade' );
  perform add_column( 'restaurant_pickup_lead_times', 'max_guests', 'int not null default 0');
  perform add_column( 'restaurant_pickup_lead_times', 'lead_time', 'int not null default 0');
  perform add_column( 'restaurant_pickup_lead_times', 'cancel_time', 'int not null default 0');
  perform add_column( 'restaurant_pickup_lead_times', 'created_at', 'timestamp not null default now()' );

  create table if not exists restaurant_pickup_times ();
  perform add_column( 'restaurant_pickup_times', 'id', 'serial primary key' );
  perform add_column( 'restaurant_pickup_times', 'restaurant_id', 'int not null references restaurants(id) on delete cascade' );
  perform add_column( 'restaurant_pickup_times', 'day', 'int not null default 0 check ( day >= 0 and day <= 6 )');
  perform add_column( 'restaurant_pickup_times', 'start_time', E'time not null default \'00:00\'' );
  perform add_column( 'restaurant_pickup_times', 'end_time', E'time not null default \'00:00\'' );
  perform add_column( 'restaurant_pickup_times', 'created_at', 'timestamp not null default now()' );
end$$;
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

  create table if not exists restaurant_pickup_lead_times ();
  perform add_column( 'restaurant_pickup_lead_times', 'id', 'serial primary key' );
  perform add_column( 'restaurant_pickup_lead_times', 'restaurant_id', 'int not null references restaurants(id)' );
  perform add_column( 'restaurant_pickup_lead_times', 'max_guests', 'int not null default 0');
  perform add_column( 'restaurant_pickup_lead_times', 'lead_time', 'int not null default 0');
  perform add_column( 'restaurant_pickup_lead_times', 'cancel_time', 'int not null default 0');
  perform add_column( 'restaurant_pickup_lead_times', 'created_at', 'timestamp not null default now()' );
end$$;
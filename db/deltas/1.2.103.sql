-- Delta

DO $$
  declare version       text := '1.2.103';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'delivery_services', 'order_submitted_notification_id', 'text' );

  update delivery_services
    set order_submitted_notification_id = 'dropoff-order-submitted'
    where name = 'Dropoff';
end$$;
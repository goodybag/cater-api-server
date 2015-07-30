-- Delta

DO $$
  declare version       text := '1.2.97';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'delivery_servies', 'order_submitted_notification_id', 'text' );
end$$;
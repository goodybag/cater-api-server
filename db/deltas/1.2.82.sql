-- Delta

DO $$
  declare version       text := '1.2.82';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'order_notifications', 'user_id', 'int references users("id")' );
end$$;
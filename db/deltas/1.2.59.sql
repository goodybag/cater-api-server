-- Delta

DO $$
  declare version       text := '1.2.59';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurants', 'disable_courier_notifications', 'boolean default false' );
end$$;

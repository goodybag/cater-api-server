-- Delta

DO $$
  declare version       text := '1.2.58';
  declare r             restaurants;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- update existing restaurants
  for r in ( select * from restaurants ) loop
    perform update_restaurant_text_id( r.id, str_to_slug( r.name ) );
  end loop;
end$$;

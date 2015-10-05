-- Delta

DO $$
  declare version       text := '1.2.108';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop table if exists user_courier_preferences;

  create table user_courier_preferences (
    user_id int references users(id) on delete cascade
  , delivery_service_id int references delivery_services(id) on delete cascade
  , constraint user_courier_preferences_pkey primary key ( user_id, delivery_service_id )
  );
end$$;
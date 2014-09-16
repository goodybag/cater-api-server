-- Delta

DO $$
  declare version       text := '1.2.37';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists delivery_service_hours ();
  perform add_column( 'delivery_service_hours', 'id', 'serial primary key' );
  perform add_column( 'delivery_service_hours', 'ds_id', 'int not null references delivery_services(id) on delete cascade' );
  perform add_column( 'delivery_service_hours', 'day', 'int not null default 0 check ( day >= 0 and day <= 6 )');
  perform add_column( 'delivery_service_hours', 'start_time', E'time not null default \'00:00\'' );
  perform add_column( 'delivery_service_hours', 'end_time', E'time not null default \'00:00\'' );
  perform add_column( 'delivery_service_hours', 'created_at', 'timestamp not null default now()' );
end$$;
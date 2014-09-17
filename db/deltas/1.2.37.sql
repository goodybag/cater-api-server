-- Delta

DO $$
  declare version       text := '1.2.37';
  declare ds            delivery_services;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column(
    'restaurants'
  , 'delivery_service_id'
  , 'int references delivery_services(id) on delete set null'
  );

  create table if not exists delivery_service_hours ();
  perform add_column( 'delivery_service_hours', 'id', 'serial primary key' );
  perform add_column( 'delivery_service_hours', 'ds_id', 'int not null references delivery_services(id) on delete cascade' );
  perform add_column( 'delivery_service_hours', 'day', 'int not null default 0 check ( day >= 0 and day <= 6 )');
  perform add_column( 'delivery_service_hours', 'start_time', E'time not null default \'00:00\'' );
  perform add_column( 'delivery_service_hours', 'end_time', E'time not null default \'00:00\'' );
  perform add_column( 'delivery_service_hours', 'created_at', 'timestamp not null default now()' );

  delete from delivery_service_hours;

  -- Add some default Courier hours basically for cap cour
  for ds in ( select * from delivery_services ) loop
    raise notice 'Updating Delivery Service %', ds.id;

    insert into delivery_service_hours
      ( ds_id, day, start_time, end_time ) values
      ( ds.id, 1, '09:00', '17:00')
    , ( ds.id, 2, '09:00', '17:00')
    , ( ds.id, 3, '09:00', '17:00')
    , ( ds.id, 4, '09:00', '17:00')
    , ( ds.id, 5, '09:00', '17:00');
  end loop;

  update restaurants set delivery_service_id = (
    select id from delivery_services where name = 'Capitol Courier' limit 1
  )
  where region_id = 1;
end$$;
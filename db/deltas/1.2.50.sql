-- Delta

DO $$
  declare version       text := '1.2.50';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "user_drivers" ();

  perform add_column( 'user_drivers', 'user_id', 'int primary key references users("id") on delete cascade' );
  perform add_column( 'user_drivers', 'phone', E'varchar(10) check ( phone similar to \'[[:digit:]]{10}\' )' );

  perform add_column( 'orders', 'driver_id', 'int references users("id") on delete set null' );

  create table if not exists "order_driver_requests" ();
  perform add_column( 'order_driver_requests', 'id', 'serial primary key' );
  perform add_column( 'order_driver_requests', 'user_id', 'int references users("id") on delete cascade' );
  perform add_column( 'order_driver_requests', 'order_id', 'int references orders("id") on delete cascade' );
  perform add_column( 'order_driver_requests', 'response', 'boolean' );
  perform add_column( 'order_driver_requests', 'response_date', 'timestamp without time zone' );
  perform add_column( 'order_driver_requests', 'created_at', 'timestamp without time zone default now()' );

  if ( select name is null from groups where name = 'driver' )
  then
    insert into groups ( name ) values ('driver');
  end if;
end$$;
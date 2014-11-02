-- Delta

DO $$
  declare version       text := '1.2.46';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "user_drivers" ();

  perform add_column( 'user_drivers', 'id', 'serial primary key' );
  perform add_column( 'user_drivers', 'user_id', 'int references users("id") on delete cascade' );
  perform add_column( 'user_drivers', 'phone', E'varchar(10) similar to \'[[:digit:]]{10}\'' );

  perform add_column( 'orders', 'driver_id', 'int references users("id") on delete set null' );

  insert into groups ( name ) values ('driver');
end$$;
-- Delta

DO $$
  declare version       text := '1.2.45';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "user_drivers" ();

  perform add_column( 'user_drivers', 'id', 'serial primary key' );
  perform add_column( 'user_drivers', 'user_id', 'int references user("id") on delete cascade' );
end$$;
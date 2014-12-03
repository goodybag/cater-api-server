DO $$
  declare version       text := '1.2.53';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "restaurant_plans" ();

  create type plan_type as enum ('tiered', 'flat');

  perform add_column( 'restaurant_plans', 'id', 'serial primary key' );
  perform add_column( 'restaurant_plans', 'type', E'plan_type not null default \'tiered\'' );
  perform add_column( 'restaurant_plans', 'name', 'text' );
  perform add_column( 'restaurant_plans', 'data', E'json not null default \'{}\'' );
  perform add_column( 'restaurant_plans', 'created_at', 'timestamp not null default now()' );
end$$;
-- Delta Regions

DO $$
  declare version         text := '1.2.11';
  declare default_region  text := 'Austin, TX';
  declare rid             int;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "regions" ();

  perform add_column( 'regions', 'id', 'serial primary key' );
  perform add_column( 'regions', 'name', 'text unique not null' );
  perform add_column( 'regions', 'timezone', E'text not null default \'America/Chicago\'' );

  select id into rid from regions where name = default_region;

  if rid is null then
    execute 'insert into regions( name ) values ( $1 ) returning id' into rid using default_region;
  end if;

  perform add_column( 'restaurants', 'region_id', 'int references regions(id)' );

  perform add_column( 'users', 'region_id', 'int references regions(id)' );
  perform add_column( 'users', 'default_zip', 'character varying(5)' );

  perform add_column( 'orders', 'region_id', 'int references regions(id)' );

  create table if not exists "delivery_services" ();

  perform add_column( 'delivery_services', 'id', 'serial primary key' );
  perform add_column( 'delivery_services', 'region_id', 'int references regions(id)' );
  perform add_column( 'delivery_services', 'name', 'text' );

  raise notice '## ID IS %', rid;

  -- Set all data to use the default region
  update orders set region_id = rid;
  update restaurants set region_id = rid;
  update users set region_id = rid;
  update delivery_services set region_id = rid;
end$$;
-- Delta Regions

DO $$
  declare version         text := '1.2.12';
  declare default_region  text := 'Austin, TX';
  declare rid             int;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "regions" ();

  perform add_column( 'regions', 'id', 'serial primary key' );
  perform add_column( 'regions', 'name', 'text unique not null' );
  perform add_column( 'regions', 'state', E'text not null' );
  perform add_column( 'regions', 'cities', 'text[] not null default Array[]::text[]' );
  perform add_column( 'regions', 'timezone', E'text not null' );
  perform add_column( 'regions', 'sales_tax', 'numeric(5,5) not null default 0' );

  select id into rid from regions where name = default_region;

  if rid is null then
    execute 'insert into regions( name ) values ( $1 ) returning id' into rid using default_region;
  end if;

  perform add_column( 'restaurants', 'region_id', 'int references regions(id)' );

  perform add_column( 'users', 'region_id', 'int references regions(id)' );
  perform add_column( 'users', 'default_zip', 'character varying(5)' );

  -- Set all data to use the default region
  update orders set region_id = rid;
  update restaurants set region_id = rid;
  update users set region_id = rid;

  -- Update Austin
  update regions set sales_tax = 0.08250 where id = rid;
  update regions set timezone = 'America/Chicago' where id = rid;
  update regions set state = 'TX' where id = rid;
  update regions set cities = Array['Austin', 'Round Rock', 'Georgetown'] where id = rid;
end$$;
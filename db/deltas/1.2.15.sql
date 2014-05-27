-- ASAP Orders and Third-Party Delivery

-- Check constraint existence
create or replace function constraint_exists( c_name text )
returns boolean as $$
begin
  return exists (
    select 1 from
      information_schema.constraint_column_usage usage
    where usage.constraint_name = c_name
  );
end;
$$ language plpgsql;

DO $$
  declare version       text := '1.2.15';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "delivery_services" ();
  perform add_column( 'delivery_services', 'id', 'serial primary key' );
  perform add_column( 'delivery_services', 'region_id', 'int references regions(id) on delete set null' );
  perform add_column( 'delivery_services', 'name', 'text' );
  perform add_column( 'delivery_services', 'rate', 'numeric(5,5) not null default 0' );
  perform add_column( 'delivery_services', 'created_at', 'timestamp not null default now()' );

  create table if not exists "delivery_service_zips" ();
  perform add_column( 'delivery_service_zips', 'id', 'serial primary key' );
  perform add_column( 'delivery_service_zips', 'delivery_service_id', 'int references delivery_services(id) on delete cascade' );
  perform add_column( 'delivery_service_zips', 'from', 'character varying(5) not null' );
  perform add_column( 'delivery_service_zips', 'to', 'character varying(5) not null' );
  perform add_column( 'delivery_service_zips', 'price', 'int not null default 0' );
  perform add_column( 'delivery_service_zips', 'created_at', 'timestamp not null default now()' );

  if not exists ( select 1 where constraint_exists( 'delivery_service_zips_delivery_service_id_from_to_key' ) is true )
  then
    alter table delivery_service_zips
      add constraint delivery_service_zips_delivery_service_id_from_to_key unique( "delivery_service_id", "from", "to" );
  end if;
end$$;

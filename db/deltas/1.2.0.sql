-- #343 Pickup orders

-- Add column to table
create or replace function add_column( tbl_name text, col_name text, col_type text )
returns void as $$
begin
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col_name ) then
    raise notice 'Adding column `%` to table `%`', col_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col_name || '" ' || col_type;
  end if;
end;
$$ language plpgsql;

-- Add type
create or replace function add_type( type_name text, type_def text )
returns void as $$
begin
  if not exists ( select 1 from pg_type where typname = type_name ) then
    raise notice 'Adding Type `%`', type_name;
    execute 'create type ' || type_name || ' as ' || type_def;
  end if;
end;
$$ language plpgsql;

DO $$
  declare version text := '1.2.0';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "restaurant_hours_of_operation" (
    id              serial primary key
  , restaurant_id   int references restaurants ("id") on delete cascade
  , day             int not null check ( day >= 0 and day <= 6 )
  , start_time      time without time zone not null
  , end_time        time without time zone not null
  , created_at      time with time zone not null default now()
  );

  perform add_type( 'order_type', E'enum(\'pickup\', \'delivery\')' );

  perform add_column( 'orders', 'pickup_person_name',   'text' );
  perform add_column( 'orders', 'pickup_person_phone',  'character varying(10)' );
  perform add_column( 'orders', 'is_pickup',            'boolean not null default false' );

  perform add_column( 'restaurants', 'order_types',     E'order_type[] not null default Array[\'pickup\', \'delivery\']::order_type[]' );
  perform add_column( 'restaurants', 'lat',             'boolean not null default true' );
  perform add_column( 'restaurants', 'lon',             'boolean not null default true' );
end$$;

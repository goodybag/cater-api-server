-- #769 Tiered Delivery Zips

-- Check for table existence
create or replace function table_exists( tbl_name text )
returns boolean as $$
begin
  return exists (
    select 1 from pg_catalog.pg_tables where tablename = tbl_name
  );
end;
$$ language plpgsql;

-- Check for column existence
create or replace function column_exists( tbl_name text, col_name text )
returns boolean as $$
begin
  return exists (
    select column_name from information_schema.columns
    where table_name = tbl_name and column_name = col_name
  );
end;
$$ language plpgsql;

-- Check constraint existence
create or replace function constraint_exists( c_type text, tbl_name text, col_name text )
returns boolean as $$
begin
  return exists (
    select 1 from
      information_schema.constraint_column_usage usage
    left join information_schema.table_constraints constraints
      on constraints.constraint_name = usage.constraint_name
    where constraints.constraint_type = c_type
      and usage.table_name = tbl_name
      and usage.column_name = col_name
  );
end;
$$ language plpgsql;

-- Add column to table
create or replace function add_column( tbl_name text, col_name text, col_type text )
returns void as $$
begin
  if exists ( select 1 from column_exists( tbl_name, col_name ) where column_exists = false ) then
    raise notice 'Adding column `%` to table `%`', col_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col_name || '" ' || col_type;
  end if;
end;
$$ language plpgsql;

-- Drop column
create or replace function drop_column( tbl_name text, col_name text )
returns void as $$
begin
  if exists ( select 1 from column_exists( tbl_name, col_name ) where column_exists = true ) then
    raise notice 'Dropping column `%` to table `%`', col_name, tbl_name;
    execute 'alter table "' || tbl_name || '" drop column "' || col_name || '"';
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
  declare version       text := '1.2.4';
  declare r             record;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurant_delivery_zips', 'fee', 'int not null default 0 check ( fee >= 0)' );

  -- For each existing delivery zip, update with restaurants current delivery fee
  for r in select * from restaurants
  loop
    update restaurant_delivery_zips
      set fee = r.delivery_fee
      where restaurant_id = r.id;
  end loop;

  perform drop_column( 'restaurants', 'delivery_fee' );
end$$;

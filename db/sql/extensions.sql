
-- enable uuid generation
create extension "uuid-ossp";

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
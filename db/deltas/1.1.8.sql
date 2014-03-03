-- #606 mark reviewed orders

DO $$
  declare version       text := '1.1.8';
  declare tbl_name      text := 'orders';
  declare col_name      text := 'reviewed';
  declare col_type      text := 'boolean';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Add col
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col_name ) then
    raise notice 'Adding column `%` to table `%`', col_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col_name || '" ' || col_type || ' default false not null ';
  end if;

end$$;

-- #558 multiple menus

DO $$
  declare version       text := '1.1.5';
  declare tbl_name      text := 'categories';
  declare col_name      text := 'menus';
  declare col_type      text := 'text[]';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Add col
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col_name ) then
    raise notice 'Adding column `%` to table `%`', col_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col_name || '" ' || col_type || ' default ''{}'' not null ';
  end if;

end$$;

-- #563 restaurant description, websites

DO $$
  declare version       text := '1.1.6';
  declare tbl_name      text := 'restaurants';
  declare col1_name     text := 'description';
  declare col1_type     text := 'text';
  declare col2_name     text := 'websites';
  declare col2_type     text := 'text[]';
  
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Add description col
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col1_name ) then
    raise notice 'Adding column `%` to table `%`', col1_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col1_name || '" ' || col1_type;
  end if;

  -- Add websites col
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col2_name ) then
    raise notice 'Adding column `%` to table `%`', col2_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col2_name || '" ' || col2_type || ' default ''{}'' not null ';
  end if;

end$$;

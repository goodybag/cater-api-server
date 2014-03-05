-- #710 individual ordering

DO $$
  declare version         text := '1.2.1';
  declare tbl_name        text := 'orders';
  declare col_name        text := 'edit_token';
  declare col_type        text := 'text';
  declare col2_name       text := 'edit_token_expires';
  declare col2_type       text := 'timestamp';

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Add col
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col_name ) then
    raise notice 'Adding column `%` to table `%`', col_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col_name || '" ' || col_type;
  end if;

  -- Add col
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col2_name ) then
    raise notice 'Adding column `%` to table `%`', col_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col2_name || '" ' || col2_type;
  end if;

end$$;

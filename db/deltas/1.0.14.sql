-- Add business logos

DO $$
  declare version       text := '1.0.14';
  declare tbl_name      text := 'restaurants';
  declare col1_name     text := 'logo_url';
  declare col2_name     text := 'logo_mono_url';
begin
  raise notice '## Running Delta v% ##', version;

  raise notice 'Using col1_name: %, col2_name: %, tbl_name: %', col1_name, col2_name, tbl_name;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Add col 1
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col1_name ) then
    raise notice 'Adding column `%` to table `%`', col1_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col1_name || '" text';
  end if;

  -- Add col 2
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col2_name ) then
    raise notice 'Adding column `%` to table `%`', col2_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col2_name || '" text';
  end if;
end$$;
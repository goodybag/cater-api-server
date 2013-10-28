-- Add business logos

DO $$
  declare version       text := '1.0.14';
  declare tbl_name      text := 'restaurants';
  declare col_name      text := 'logo_url';
begin
  raise notice '## Running Delta v% ##', version;

  raise notice 'Using col_name: %, tbl_name: %', col_name, tbl_name;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Update table
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col_name ) then
    raise notice 'Adding column `%` to table `%`', col_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col_name || '" text';
  end if;
end$$;
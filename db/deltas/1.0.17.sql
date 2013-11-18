-- Add cancel times

DO $$
  declare version       text := '1.0.17';
  declare tbl_name      text := 'restaurant_lead_times';
  declare col_name      text := 'cancel_time';
begin
  raise notice '## Running Delta v% ##', version;

  raise notice 'Using col_name: %, tbl_name: %', col_name, tbl_name;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Add col
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col_name ) then
    raise notice 'Adding column `%` to table `%`', col_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col_name || '" integer';
  end if;
end$$;

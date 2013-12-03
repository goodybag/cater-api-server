-- Add Yelp business ID

DO $$
  declare version       text := '1.1.3';
  declare tbl_name      text := 'restaurants';
  declare col_name      text;
  declare col_type      text;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Add col
  col_name := 'yelp_business_id';
  col_type := 'text';
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col_name ) then
    raise notice 'Adding column `%` to table `%`', col_name, tbl_name;
    execute 'alter table "' || tbl_name || '" add column "' || col_name || '" ' || col_type;
  end if;

  col_name := 'yelp_data';
  col_type := 'json';
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name and column_name = col_name ) then
    raise notice 'Adding column `%` to table `%` type `%`', col_name, tbl_name, col_type;
    alter table "restaurants" add column "yelp_data" json default '{}';
    -- this is not effing working
    -- execute "alter table " || tbl_name || " add column " || col_name || " " || col_type || " default '{}'";
  end if;
end$$;

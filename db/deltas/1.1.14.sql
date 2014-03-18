
DO $$
  declare version       text := '1.1.13';

  declare tbl_name1      text := 'users';
  declare col_name1      text := 'points';
  declare col_type1      text := 'int';

  declare tbl_name2      text := 'orders';
  declare col_name2      text := 'points_awarded';
  declare col_type2      text := 'boolean';

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Add col points to user table
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name1 and column_name = col_name1 ) then
    raise notice 'Adding column `%` to table `%`', col_name1, tbl_name1;
    execute 'alter table "' || tbl_name1 || '" add column "' || col_name1 || '" ' || col_type1 || ' CHECK (points >= 0) DEFAULT 500';
  end if;

  -- Add col points_awarded to orders table
  if not exists ( select 1 from information_schema.columns where table_name = tbl_name2 and column_name = col_name2 ) then
    raise notice 'Adding column `%` to table `%`', col_name2, tbl_name2;
    execute 'alter table "' || tbl_name2 || '" add column "' || col_name2 || '" ' || col_type2 || ' DEFAULT FALSE';
  end if;

end$$;

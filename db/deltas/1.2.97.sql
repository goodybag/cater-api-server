DO $$
  declare version       text := '1.2.97';
  declare virtual_org   record;
  declare user_rec      users;
  declare org           record;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
  alter table order_internal_notes alter column created_at set data type timestamptz;
end$$;
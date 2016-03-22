-- Delta

DO $$
  declare version       text := '1.2.125';
  declare r cuisines;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  if not exists (
    select 1 from cuisines where name = 'Hot Chicken'
  ) then
    insert into cuisines ( name ) values ('Hot Chicken');
  end if;

  if not exists (
    select 1 from cuisines where name = 'Meat and Three'
  ) then
    insert into cuisines ( name ) values ('Meat and Three');
  end if;
end$$;
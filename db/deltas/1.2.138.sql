-- Delta

DO $$
  declare version       text := '1.2.138';
  declare r cuisines;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  if not exists (
    select 1 from cuisines where name = 'Boxed Lunches'
  ) then
    insert into cuisines ( name ) values ('Boxed Lunches');
  end if;
end$$;

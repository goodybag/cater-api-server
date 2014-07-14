-- Delta

DO $$
  declare version       text := '1.2.23';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  delete from meal_types where name = 'Brunch';

  

end$$;
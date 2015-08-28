-- Delta

DO $$
  declare version       text := '1.2.99';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table addresses alter column is_default set default false;
end$$;
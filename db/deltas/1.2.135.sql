-- Delta

DO $$
  declare version       text := '1.2.135';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table orders alter column review_token set default uuid_generate_v4();
end$$;

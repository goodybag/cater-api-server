-- Delta

DO $$
  declare version       text := '1.2.54';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table "orders" alter column "user_id" drop not null;
end$$;
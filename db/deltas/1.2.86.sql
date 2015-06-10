-- Delta

DO $$
  declare version       text := '1.2.86';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Used for accounting privileges like making special transfers on Stripe
  insert into "groups" (name) values ('accounting');

  -- Enable accounting for Om
  insert into users_groups values (6, 'accounting');
end$$;

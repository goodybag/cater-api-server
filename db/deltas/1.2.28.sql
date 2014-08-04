-- Delta
-- Break up on_order_type_change into separate triggers
-- so we know inside the handler what to change to

DO $$
  declare version       text := '1.2.28';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop trigger if exists on_order_type_change on orders;
end$$;
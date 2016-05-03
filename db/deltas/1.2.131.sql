-- Delta

DO $$
  declare version       text := '1.2.131';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  ALTER TABLE orders ADD COLUMN actual_delivery_datetime timestamp;
end$$;

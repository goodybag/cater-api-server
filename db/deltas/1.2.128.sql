-- Delta

DO $$
  declare version       text := '1.2.128';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  ALTER TABLE orders ADD COLUMN waive_transaction_fee BOOLEAN NOT NULL DEFAULT false;
end$$;

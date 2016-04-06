-- Delta

DO $$
  declare version       text := '1.2.129';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  ALTER TABLE orders
    DROP CONSTRAINT orders_delivery_service_id_fkey,
    ADD CONSTRAINT orders_delivery_service_id_fkey
      FOREIGN KEY (delivery_service_id)
      REFERENCES delivery_services (id)
      ON DELETE SET NULL;
end$$;

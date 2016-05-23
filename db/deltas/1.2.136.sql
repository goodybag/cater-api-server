-- Delta

DO $$
  declare version       text := '1.2.136';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  INSERT INTO features (id, name) VALUES ('order-flow', 'Order Flow');
end$$;

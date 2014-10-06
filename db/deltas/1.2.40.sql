-- Delta

DO $$
  declare version       text := '1.2.40';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'items', 'min_qty', 'int default 0');
  perform add_column( 'order_items', 'min_qty', 'int default 0');

end$$;

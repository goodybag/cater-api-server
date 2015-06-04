-- Delta

DO $$
  declare version       text := '1.2.69';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column(
    'restaurants',
    'supported_order_types',
    E'order_type[] default Array[\'pickup\', \'courier\', \'delivery\']::order_type[]'
  );

  update restaurants
    set supported_order_types = Array['pickup', 'delivery']::order_type[]
    where disable_courier is true;
end$$;

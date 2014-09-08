-- Delta

DO $$
  declare version       text := '1.2.37';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'region_id', 'int not null default 1' );
  ALTER TABLE orders ADD CONSTRAINT orders_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions ON DELETE CASCADE;

  with orders_regions as (
    select orders.id as order_id, regions.id as region_id from orders 
    join restaurants
      on orders.restaurant_id = restaurants.id
    join regions
      on restaurants.region_id = regions.id
  ) update orders
  set region_id = orders_regions.region_id
  from orders_regions
  where orders.id = orders_regions.order_id;

end$$;

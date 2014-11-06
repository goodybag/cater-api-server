-- Fix old orders restaurant_totals

DO $$
  declare version       text := '1.2.44';
  declare o             orders;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  for o in ( select * from orders where total > 0 and restaurant_total = 0 )
  loop
    raise notice 'Updating Order #%',  o.id;
    perform update_order_totals( o );
  end loop;
end$$;
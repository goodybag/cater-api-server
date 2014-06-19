-- #957

DO $$
  declare version       text := '1.2.20';
  declare r orders;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop trigger if exists order_total_change on orders;

  for r in (
    select * from orders where restaurant_id in (
      select id from restaurants
    )
    order by id asc
  )
  loop
    raise notice 'Updating Order #%', r.id;
    perform update_order_totals( r );
  end loop;

  create trigger order_total_change
    after insert or update of zip, tip, adjustment_amount
    on orders
    for each row
    execute procedure on_order_total_change();
end$$;
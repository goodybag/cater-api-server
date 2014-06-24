-- ASAP Order Part 3

DO $$
  declare version       text := '1.2.22';
  declare r order_items;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'pickup_datetime', 'timestamp without time zone' );
  perform add_column( 'orders', 'is_delivery', 'boolean not null default false' );
  perform add_column( 'orders', 'is_delivery_service', 'boolean not null default false' );

  -- The point in which we switch from using delivery service to restaurant delivery
  perform add_column( 'restaurants', 'head_count_delivery_service_threshold', 'int not null default 0' );

  perform add_column( 'order_items', 'sub_total', 'int not null default 0' );

  drop trigger if exists order_order_items_change on order_items;
  drop trigger if exists order_order_items_remove on order_items;

  for r in (
    select * from order_items order by id asc
  )
  loop
    raise notice 'Updating Order Item #%', r.id;

    perform update_order_item_subtotal( r );
  end loop;

  create trigger order_order_items_change
    after insert or update of quantity, price, options_sets
    on order_items
    for each row
    execute procedure on_order_items_change();

  create trigger order_order_items_remove
    after delete
    on order_items
    for each row
    execute procedure on_order_items_remove();
end$$;
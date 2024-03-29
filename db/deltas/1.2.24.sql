-- ASAP Order Part 3

DO $$
  declare version       text := '1.2.24';
  declare r order_items;
  declare o orders;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'pickup_datetime', 'timestamp without time zone' );
  perform add_column( 'orders', 'is_delivery', 'boolean not null default false' );
  perform add_column( 'orders', 'is_delivery_service', 'boolean not null default false' );
  perform add_column( 'orders', 'ds_token', 'text' );
  perform add_column( 'orders', 'ds_token_used', 'timestamp' );

  -- The point in which we switch from using delivery service to restaurant delivery
  perform add_column( 'restaurants', 'delivery_service_head_count_threshold', 'int not null default 0' );
  perform add_column( 'restaurants', 'delivery_service_order_total_upperbound', 'int not null default 0' );

  perform add_column( 'order_items', 'sub_total', 'int not null default 0' );

  perform add_column( 'delivery_services', 'order_email', 'text' );
  perform add_column( 'delivery_services', 'order_phone', 'varchar(10)' );

  update restaurants set
    delivery_service_head_count_threshold = 60
  , delivery_service_order_amount_threshold = 50000
  , delivery_service_order_total_upperbound = 200000;

  drop trigger if exists order_order_items_change on order_items;
  drop trigger if exists order_order_items_remove on order_items;
  drop trigger if exists on_order_datetime_change on orders;
  drop trigger if exists on_order_type_change on orders;

  for r in (
    select * from order_items order by id asc
  )
  loop
    raise notice 'Updating Order Item #%', r.id;

    perform update_order_item_subtotal( r );
  end loop;

  for o in (
    select * from orders
    where restaurant_id in (
      select id from restaurants
    )
    order by id asc
  )
  loop
    raise notice 'Updating Order #%', o.id;

    perform update_order_totals( o );
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

  create trigger on_order_datetime_change
    after insert or update of datetime
    on orders
    for each row
    execute procedure on_order_datetime_change();

  create trigger on_order_type_change
    after update of is_pickup, is_delivery, is_delivery_service
    on orders
    for each row
    when ( OLD.* is distinct from NEW.* )
    execute procedure on_order_type_change();
end$$;
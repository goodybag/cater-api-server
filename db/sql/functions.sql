--------------------
-- Event Handlers --
--------------------
create or replace function on_order_create()
returns trigger as $$
begin
  perform ensure_order_type( NEW );
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_type_is_pickup_change()
returns trigger as $$
begin
  if NEW.is_pickup is true then
    perform update_order_types( NEW, 'is_pickup' );
    -- Unfortunately, update_order_types does not mutate the NEW object
    -- Therefore, a stale order object is passed to update_order_totals
    -- and the totals (specifically the delivery_fee) end up being wrong
    -- To fix this, pass the order.id and do a fresh look-up
    perform update_order_totals( NEW.id );
  else
    perform ensure_order_type( NEW );
  end if;
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_type_is_delivery_change()
returns trigger as $$
begin
  if NEW.is_delivery is true then
    perform update_order_types( NEW, 'is_delivery' );
    -- Unfortunately, update_order_types does not mutate the NEW object
    -- Therefore, a stale order object is passed to update_order_totals
    -- and the totals (specifically the delivery_fee) end up being wrong
    -- To fix this, pass the order.id and do a fresh look-up
    perform update_order_totals( NEW.id );
  else
    perform ensure_order_type( NEW );
  end if;
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_type_is_delivery_service_change()
returns trigger as $$
begin
  if NEW.is_delivery_service is true then
    perform update_order_types( NEW, 'is_delivery_service' );
    perform update_order_delivery_service_id( NEW.id );
    perform update_order_delivery_service_pickup_time( NEW.id );
    -- Unfortunately, update_order_types does not mutate the NEW object
    -- Therefore, a stale order object is passed to update_order_totals
    -- and the totals (specifically the delivery_fee) end up being wrong
    -- To fix this, pass the order.id and do a fresh look-up
    perform update_order_totals( NEW.id );
  else
    perform ensure_order_type( NEW );
  end if;
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_datetime_change()
returns trigger as $$
begin
  if NEW.is_delivery_service is true then
    perform update_order_delivery_service_pickup_time( NEW.id );
  end if;
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_type_change()
returns trigger as $$
begin
  if NEW.is_delivery_service is true then
    perform update_order_delivery_service_id( NEW.id );
    perform update_order_delivery_service_pickup_time( NEW.id );
  end if;

  perform update_order_types( NEW );
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_items_change()
returns trigger as $$
begin
  perform update_order_totals( NEW.order_id );
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_total_change()
returns trigger as $$
begin
  perform update_order_totals( NEW );
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_items_change()
returns trigger as $$
begin
  perform update_order_totals( NEW.order_id );
  perform update_order_item_subtotal( NEW );
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_items_remove()
returns trigger as $$
begin
  perform update_order_totals( OLD.order_id );
  return OLD;
end;
$$ language plpgsql;

---------------
-- Functions --
---------------
create or replace function update_order_delivery_service_id( oid int )
returns void as $$
begin
  -- Just select some arbitrary in-region delivery service for now
  update orders
    set delivery_service_id = (
      select delivery_services.id from delivery_services
        left join orders on orders.id = oid
        left join restaurants on orders.restaurant_id = restaurants.id
        left join regions on restaurants.region_id = regions.id
        where orders.id = oid
        limit 1
    )
    where id = oid;
end;
$$ language plpgsql;

create or replace function update_order_delivery_service_pickup_time( oid int )
returns void as $$
  declare o orders;
begin
  update orders
    set pickup_datetime = ( select get_order_delivery_service_pickup_time( oid ) )
    where id = oid;
end;
$$ language plpgsql;

create or replace function get_order_delivery_service_pickup_time( oid int )
returns timestamp as $$
  declare o orders;
begin
  return ( select datetime - regions.lead_time_modifier from orders
  left join restaurants on orders.restaurant_id = restaurants.id
  left join regions on restaurants.region_id = regions.id
  where orders.id = oid );
end;
$$ language plpgsql;

create or replace function ensure_order_type( oid int )
returns void as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    perform ensure_order_type( o, type );
  end loop;
end;
$$ language plpgsql;

create or replace function ensure_order_type( o orders )
returns void as $$
begin
  if (
    not o.is_pickup and
    not o.is_delivery and
    not o.is_delivery_service
  ) then
    update orders set is_delivery = true where id = o.id;
  end if;
end;
$$ language plpgsql;

create or replace function update_order_types( oid int, type text )
returns void as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    perform update_order_types( o, type );
  end loop;
end;
$$ language plpgsql;

create or replace function update_order_types( o orders, type text )
returns void as $$
begin
  if type = 'is_pickup' then
    update orders set
      is_pickup           = true
    , is_delivery         = false
    , is_delivery_service = false
    where id = o.id;
  elsif type = 'is_delivery' then
    update orders set
      is_delivery = true
    , is_pickup           = false
    , is_delivery_service = false
    where id = o.id;
  elsif type = 'is_delivery_service' then
    update orders set
      is_delivery_service = true
    , is_pickup           = false
    , is_delivery         = false
    where id = o.id;
  end if;
end;
$$ language plpgsql;

create or replace function get_order_delivery_fee( oid int )
returns int as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    return get_order_delivery_fee( o );
  end loop;
end;
$$ language plpgsql;

create or replace function get_order_delivery_fee( o orders )
returns int as $$
  declare default_fee int;
begin
  -- If `zip` does not exist, just pick the least expensive one
  default_fee := (select fee from restaurant_delivery_zips
    where restaurant_id = o.restaurant_id
    order by fee asc
    limit 1);

  -- Delivery Service Order
  if o.is_delivery_service is true
  then

    if o.delivery_service_id is not null
    then
      return coalesce(
        ( select delivery_service_zips.price from delivery_service_zips
          left join restaurants on restaurants.id = o.restaurant_id
          where delivery_service_zips."from" = restaurants.zip
            and delivery_service_zips."to" = o.zip
            and delivery_service_zips.delivery_service_id = o.delivery_service_id
          limit 1
        )
      , default_fee
      );
    end if;

    return coalesce(
      ( select delivery_service_zips.price from delivery_service_zips
        left join restaurants on restaurants.id = o.restaurant_id
        where delivery_service_zips."from" = restaurants.zip
          and delivery_service_zips."to" = o.zip
        order by price asc
        limit 1
      )
    , default_fee
    );
  end if;

  -- Pickup Order
  if o.is_pickup is true
  then
    return 0;
  end if;

  -- Restaurant Delivery Order
  return coalesce(
    ( select fee from restaurant_delivery_zips
      where restaurant_id = o.restaurant_id
      and zip = o.zip
    )
  , default_fee
  );
end;
$$ language plpgsql;

create or replace function update_order_totals( oid int )
returns void as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    perform update_order_totals( o );
    return;
  end loop;
end;
$$ language plpgsql;

create or replace function update_order_totals( o orders )
returns void as $$
  declare order_item record;
  declare option record;
  declare tax_rate      numeric;
  declare options_total int := 0;
  declare delivery_fee  int := 0;
  declare sub_total     int := 0;
  declare sales_tax     int := 0;
  declare total         int := 0;
  declare curr          int := 0;
begin
  tax_rate := (
    select regions.sales_tax
    from orders
    left join restaurants on orders.restaurant_id = restaurants.id
    left join regions on restaurants.region_id = regions.id
    where orders.id = o.id
  );

  delivery_fee := get_order_delivery_fee( o );

  for order_item in (
    select * from order_items where order_id = o.id
  ) loop
    curr := order_item.price;

    options_total := coalesce( (
      with options1 as (
        select json_array_elements(
          json_array_elements( order_item.options_sets )->'options'
        ) as option
      ),
      options as (
        select
          (options1.option->>'state')::boolean as state
        , (options1.option->>'price')::int as price
        from options1
      )

      select sum( options.price ) from options where options.state is true
    ), 0 );

    curr := curr + options_total;

    sub_total := sub_total + (curr * order_item.quantity);
  end loop;

  sub_total   := sub_total + coalesce( o.adjustment_amount, 0 );
  total       := sub_total + delivery_fee;
  sales_tax   := round( total * tax_rate );
  total       := total + sales_tax + o.tip;

  -- Debug
  -- raise notice '#############################';
  -- raise notice 'Delivery Fee:   %', delivery_fee;
  -- raise notice 'Tax Rate:       %', tax_rate;
  -- raise notice 'Sub Total:      %', sub_total;
  -- raise notice 'Sales Tax:      %', sales_tax;
  -- raise notice 'Total:          %', total;
  -- raise notice '#############################';

  execute 'update orders set sub_total = $1, total = $2, sales_tax = $3, delivery_fee = $4 where id = $5'
    using sub_total, total, sales_tax, delivery_fee, o.id;
end;
$$ language plpgsql;

create or replace function update_order_item_subtotal( oid int )
returns void as $$
  declare o order_items;
begin
  for o in ( select * from order_items where id = oid )
  loop
    perform update_order_item_subtotal( o );
    return;
  end loop;
end;
$$ language plpgsql;

create or replace function update_order_item_subtotal( order_item order_items )
returns void as $$
  declare options_total int;
begin
  options_total := coalesce( (
    with options1 as (
      select json_array_elements(
        json_array_elements( order_item.options_sets )->'options'
      ) as option
    ),
    options as (
      select
        (options1.option->>'state')::boolean as state
      , (options1.option->>'price')::int as price
      from options1
    )

    select sum( options.price ) from options where options.state is true
  ), 0 );

  update order_items
    set sub_total = order_item.quantity * ( order_item.price + options_total )
  where id = order_item.id;
end;
$$ language plpgsql;
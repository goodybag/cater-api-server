--------------------
-- Event Handlers --
--------------------
create or replace function on_order_create()
returns trigger as $$
begin
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_type_change()
returns trigger as $$
begin
  if NEW.type = 'courier' then
    perform update_order_delivery_service_id( NEW.id );
    perform update_order_delivery_service_pickup_time( NEW.id );

    -- Since update_order_delivery_service_id could affect the delivery_fee
    -- use NEW.id to fetch a non-stale record
    perform update_order_totals( NEW.id );
  else
    perform update_order_totals( NEW );
  end if;
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_datetime_change()
returns trigger as $$
begin
  if NEW.type = 'courier' then
    perform update_order_delivery_service_pickup_time( NEW.id );
  end if;
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
  -- Pickup Order
  if o.type = 'pickup' then
    return 0;
  end if;

  -- If `zip` does not exist, just pick the least expensive one
  default_fee := (select fee from restaurant_delivery_zips
    where restaurant_id = o.restaurant_id
    order by fee asc
    limit 1);

  if o.type = 'delivery' then
    return coalesce(
      (select fee from restaurant_delivery_zips rdz
      where rdz.zip = o.zip
        and rdz.restaurant_id = o.restaurant_id
      order by fee asc
      limit 1)
    , default_fee
    );
  end if;

  if o.type = 'courier' then
    return coalesce(
      (select dsz.price from delivery_service_zips dsz
      left join restaurants rs on rs.id = o.restaurant_id
      where dsz."from" = rs.zip
        and dsz."to" = o.zip
      limit 1)
    , default_fee
    );
  end if;

  return coalesce(
    default_fee
  , 0
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
  declare order_item        record;
  declare option            record;
  declare tax_rate          numeric;
  declare options_total     int := 0;
  declare delivery_fee      int := 0;
  declare sub_total         int := 0;
  declare sales_tax         int := 0;
  declare total             int := 0;
  declare restaurant_total  int := 0;
  declare r_sales_tax       int := 0;
  declare curr              int := 0;
  declare tax_exempt        boolean;
begin
  tax_rate := (
    select regions.sales_tax
    from orders
    left join restaurants on orders.restaurant_id = restaurants.id
    left join regions on restaurants.region_id = regions.id
    where orders.id = o.id
  );

  tax_exempt := (select is_tax_exempt from users where users.id = o.user_id);

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

  total             := sub_total + coalesce( o.adjustment_amount, 0 );

  -- Values for restaurant_total and total can diverge
  -- since there are user specific adjustements now
  -- We repeat operations for the two values
  restaurant_total  := total;
  total             := total + o.user_adjustment_amount;

  -- Only add delivery fee to restaurant total if they're delivering
  if o.type = 'delivery' then
    restaurant_total := restaurant_total + delivery_fee;
  end if;

  total := total + delivery_fee;

  if not tax_exempt then
    sales_tax       := round( total * tax_rate );
  end if;

  total             := total + sales_tax + o.tip;

  if not tax_exempt then
    r_sales_tax     := round( restaurant_total * tax_rate );
  end if;

  restaurant_total  := restaurant_total + r_sales_tax;

  -- Only add tip if it was pickup or delivery
  if o.type != 'courier' then
    restaurant_total := restaurant_total + o.tip;
  end if;

  -- Debug
  -- raise notice '#############################';
  -- raise notice 'Delivery Fee:           %', delivery_fee;
  -- raise notice 'Tax Rate:               %', tax_rate;
  -- raise notice 'Sub Total:              %', sub_total;
  -- raise notice 'Sales Tax:              %', sales_tax;
  -- raise notice 'Total:                  %', total;
  -- raise notice 'R. Sales Tax:           %', r_sales_tax;
  -- raise notice 'R. Total:               %', restaurant_total;
  -- raise notice '#############################';

  execute 'update orders set '
    || 'sub_total = $1, '
    || 'total = $2, '
    || 'sales_tax = $3, '
    || 'delivery_fee = $4, '
    || 'restaurant_total = $5, '
    || 'restaurant_sales_tax = $6 '
    || 'where id = $7'
    using sub_total, total, sales_tax, delivery_fee, restaurant_total, r_sales_tax, o.id;
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

-- Update search vectors based on relevant relations
create or replace function update_orders_search_vector_from_orders()
returns trigger as $$
begin
  update orders as o
  set search_vector = to_tsvector( 'english',
      o.id                            || ' ' ||
      coalesce(new.name, '')          || ' ' ||
      coalesce(restaurant_name, '')   || ' ' ||
      coalesce(user_name, '')         || ' ' ||
      coalesce(user_email, '')        || ' ' ||
      coalesce(user_organization, '') || ' '
    )
  from orders_search_view as osv
  where o.id = osv.order_id and osv.order_id = new.id;
  return new;
end;
$$ language plpgsql;

create or replace function update_orders_search_vector_from_restaurants()
returns trigger as $$
begin
  update orders as o
  set search_vector = to_tsvector( 'english',
      o.id                            || ' ' ||
      coalesce(order_name, '')        || ' ' ||
      coalesce(new.name, '')          || ' ' ||
      coalesce(user_name, '')         || ' ' ||
      coalesce(user_email, '')        || ' ' ||
      coalesce(user_organization, '') || ' '
    )
  from orders_search_view as osv
  where o.id = osv.order_id and osv.restaurant_id = new.id;
  return new;
end;
$$ language plpgsql;

create or replace function update_orders_search_vector_from_users()
returns trigger as $$
begin
  update orders as o
  set search_vector = to_tsvector( 'english',
      o.id                            || ' ' ||
      coalesce(order_name, '')        || ' ' ||
      coalesce(restaurant_name, '')   || ' ' ||
      coalesce(new.name, '')          || ' ' ||
      coalesce(new.email, '')         || ' ' ||
      coalesce(new.organization, '')  || ' '
    )
  from orders_search_view as osv
  where o.id = osv.order_id and osv.user_id = new.id;
  return new;
end;
$$ language plpgsql;

create or replace function update_restaurant_search_vector()
returns trigger as $$
begin
  update restaurants as r
  set search_vector = to_tsvector( 'english',
      r.name
    )
  where r.id = new.id;
  return new;
end;
$$ language plpgsql;

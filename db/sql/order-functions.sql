---------------------
-- Order Functions --
---------------------

create or replace function order_get_price_hike( oid int )
returns numeric(5,5) as $$
begin
  return coalesce(
    ( select users.priority_account_price_hike_percentage
      from orders
      left join users on users.id = orders.user_id
      where orders.id = oid
      limit 1 )
  , 0
  );
end;
$$ language plpgsql;

-- Order.sub_total
create or replace function order_sub_total( oid int )
returns int as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    return order_sub_total( o );
  end loop;
end;
$$ language plpgsql;

create or replace function order_sub_total( o orders )
returns int as $$
  declare order_item        record;
  declare sub_total         int := 0;
  declare curr              int := 0;
  declare options_total     int := 0;
begin
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

  return sub_total;
end;
$$ language plpgsql;

-- Order.amenities_total
create or replace function order_amenities_total( oid int )
returns int as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    return order_amenities_total( o );
  end loop;
end;
$$ language plpgsql;

create or replace function order_amenities_total( o orders )
returns int as $$
  declare order_amenity     record;
  declare amenities_total   int := 0;
begin
  for order_amenity in (
    select * from order_amenities
    join amenities on amenities.id = order_amenities.amenity_id
    where order_id = o.id
  ) loop
    if order_amenity.scale = 'multiply' then
      amenities_total := amenities_total + (order_amenity.price * o.guests);
    else
      amenities_total := amenities_total + order_amenity.price;
    end if;
  end loop;

  return amenities_total;
end;
$$ language plpgsql;

-- Order.amenities_total
create or replace function order_delivery_fee( oid int )
returns int as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    return order_delivery_fee( o );
  end loop;
end;
$$ language plpgsql;

create or replace function order_delivery_fee( o orders )
returns int as $$
  declare default_fee int;
begin
  -- Pickup Order
  if o.type = 'pickup' then
    return 0;
  end if;

  if o.waive_delivery_fee then
    return 0;
  end if;

  -- If `zip` does not exist, just pick the least expensive one
  default_fee := coalesce(
    (select fee from restaurant_delivery_zips
      where restaurant_id = o.restaurant_id
      order by fee asc
      limit 1)
  , 0 );

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
      left join restaurant_locations rl on rl.id = o.restaurant_location_id
      where dsz."from" = rl.zip
        and dsz."to" = o.zip
        and dsz.delivery_service_id = o.delivery_service_id
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

-- Order.tax_rate
create or replace function order_tax_rate( o int )
returns numeric( 5, 5 ) as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    return order_tax_rate( o );
  end loop;
end;
$$ language plpgsql;

create or replace function order_tax_rate( o orders )
returns numeric( 5, 5 ) as $$
begin
  return coalesce(
    (select regions.sales_tax
    from restaurants
    left join regions on restaurants.region_id = regions.id
    where restaurants.id = o.restaurant_id)
  , 0
  );
end;
$$ language plpgsql;

-- Order.is_tax_exempt
create or replace function order_is_tax_exempt( o int )
returns boolean as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    return order_is_tax_exempt( o );
  end loop;
end;
$$ language plpgsql;

create or replace function order_is_tax_exempt( o orders )
returns boolean as $$
begin
  return (select is_tax_exempt from users where users.id = o.user_id);
end;
$$ language plpgsql;

-- Order.no_contract_amount
create or replace function order_no_contract_amount( o int )
returns numeric( 5,5 ) as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    return order_no_contract_amount( o );
  end loop;
end;
$$ language plpgsql;

create or replace function order_no_contract_rate( o orders )
returns numeric( 5,5 ) as $$
begin
  if o.waive_transaction_fee then
    return 0;
  else
    return coalesce(
      (select no_contract_fee
      from restaurants
      where restaurants.id = o.restaurant_id
        and plan_id is null)
    , 0
    );
  end if;
end;
$$ language plpgsql;

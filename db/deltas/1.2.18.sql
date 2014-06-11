-- Delta

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
begin
  return coalesce(
    ( select fee from restaurant_delivery_zips
      where restaurant_id = o.restaurant_id
      and zip = o.zip
    )
      -- If `zip` does not exist, just pick the least expensive one
  , ( select fee from restaurant_delivery_zips
      where restaurant_id = o.restaurant_id
      order by fee asc
      limit 1
    )
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

  execute 'update orders set sub_total = $1, total = $2, sales_tax = $3 where id = $4'
    using sub_total, total, sales_tax, o.id;
end;
$$ language plpgsql;

DO $$
  declare version       text := '1.2.18';
  declare r orders;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'orders', 'sub_total',    'int not null default 0' );
  perform add_column( 'orders', 'sales_tax',    'int not null default 0' );
  perform add_column( 'orders', 'total',        'int not null default 0' );
  perform add_column( 'orders', 'delivery_fee', 'int not null default 0' );

  drop trigger if exists order_order_items_change on order_items;
  drop trigger if exists order_total_change on orders;

  for r in (
    select * from orders where restaurant_id in (
      select id from restaurants
    )
  )
  loop
    raise notice 'Updating Order #%', r.id;

    update orders
      set delivery_fee = get_order_delivery_fee( r )
    where orders.id = r.id;

    perform update_order_totals( r );
  end loop;

  create trigger order_order_items_change
    after insert or update or delete
    on order_items
    for each row
    execute procedure on_order_items_change();

  create trigger order_total_change
    after insert or update of delivery_fee, tip, adjustment_amount
    on orders
    for each row
    execute procedure on_order_total_change();
end$$;
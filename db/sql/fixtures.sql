INSERT INTO groups (name) VALUES ('admin');
INSERT INTO groups (name) VALUES ('client');
INSERT INTO groups (name) VALUES ('restaurant');
INSERT INTO groups (name) VALUES ('receipts');
INSERT INTO groups (name) VALUES ('pms');

INSERT INTO users (email, password) VALUES ('receipts@goodybag.com', '$2a$10$8egVetFrE7OAk1B.v36dOOdhS9TXt98PN7/zCvLdeAuOa0KLXIzIi');
INSERT INTO users_groups (user_id, "group") SELECT id, 'receipts' FROM users WHERE email = 'receipts@goodybag.com';

INSERT INTO users (email, password) VALUES ('pms@goodybag.com', '$2a$10$FGN90mpEJjVxieb1B.98YeVF6fJQ1/Bs6BQZ5wAEyCTnmxvLFazlq');
INSERT INTO users_groups (user_id, "group") SELECT id, 'pms' FROM users WHERE email = 'pms@goodybag.com';

INSERT INTO tags (name)
SELECT existing.*
FROM (SELECT unnest(array['glutenFree','vegan', 'vegetarian','kosher','halal', 'dairyFree']) as tag) AS existing
WHERE NOT EXISTS (SELECT name from tags WHERE existing.tag = tags.name);

INSERT INTO meal_types (name)
SELECT existing.*
FROM
  (SELECT unnest(array[
    'Appetizers'
  , 'Breakfast'
  , 'Brunch'
  , 'Lunch'
  , 'Dinner'
  , 'Dessert'
  ]) as meal_type) AS existing
WHERE NOT EXISTS (SELECT name from meal_types WHERE existing.meal_type = meal_types.name);



create function process_updated_order() returns trigger as $process_updated_order$
  begin
    insert into order_statuses(order_id, status) values(NEW.id, NEW.status);
    return null;
  end
$process_updated_order$ language plpgsql;

create function process_new_order() returns trigger as $process_new_order$
  begin
    insert into order_statuses(order_id, status) values(NEW.id, NEW.status);
    return null;
  end
  $process_new_order$ language plpgsql;

create trigger update_order_status
  after update on orders
  for each row
  when (old.status is distinct from new.status)
  execute procedure process_updated_order();

create trigger new_order_status
  after insert on orders
  for each row
  execute procedure process_new_order();

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
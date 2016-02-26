-- @import "./order-functions.sql";

--------------------
-- Event Handlers --
--------------------

create or replace function on_user_create()
returns trigger as $$
begin
  update users set priority_account_price_hike_percentage = (
    select regions.default_price_hike from regions
    where regions.id = users.region_id
  ) where id = NEW.id;
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_user_change()
returns trigger as $$
begin
  update orders
    set priority_account_price_hike_percentage = order_get_price_hike( NEW.id )
    where id = NEW.id;
  return NEW;
end;
$$ language plpgsql;

create or replace function on_user_organization_update()
returns trigger as $$
  declare org_id int;
begin
  -- TODO:
  -- Remove this when we implement more organizations features
  if ( NEW.organization is not null and NEW.organization != '' )
  then
    org_id := create_or_get_organization( NEW.organization );
    perform organization_user_adoption( org_id, NEW.id );
  end if;
  
  return NEW;
end;
$$ language plpgsql;

create or replace function on_restaurant_name_change()
returns trigger as $$
begin
  perform update_restaurant_text_id( NEW.id );
  return NEW;
end;
$$ language plpgsql;

create or replace function restaurant_locations_is_default_change()
returns trigger as $$
begin
  update restaurant_locations
    set is_default = false
    where restaurant_id = NEW.restaurant_id
      and id != NEW.id;
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_amenities_update()
returns trigger as $$
begin
  perform update_order_totals( NEW.order_id );
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_amenities_remove()
returns trigger as $$
begin
  perform update_order_totals( OLD.order_id );
  return OLD;
end;
$$ language plpgsql;

create or replace function on_order_create()
returns trigger as $$
begin
  if ( NEW.restaurant_location_id is null ) then
    perform set_order_default_location( NEW );
  end if;
  perform set_order_feedback( NEW );
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_restaurant_change()
returns trigger as $$
begin
  perform set_order_default_location( NEW );
  return NEW;
end;
$$ language plpgsql;

create or replace function on_order_type_change()
returns trigger as $$
begin
  if NEW.type = 'courier' then
    -- No delivery service set? Assign one
    if NEW.delivery_service_id is null then
      perform update_order_delivery_service_id( NEW.id );
    end if;

    perform update_order_delivery_service_pickup_time( NEW.id );

    -- Since update_order_delivery_service_id could affect the delivery_fee
    -- use NEW.id to fetch a non-stale record
    perform update_order_totals( NEW.id );
  else
    perform update_order_totals( NEW );

    -- No longer courier, check to see if we need to null out dsid
    if NEW.delivery_service_id is not null then
      update orders set delivery_service_id = null where id = NEW.id;
    end if;
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
create or replace function create_or_get_organization( org_name text )
returns int as $$
  declare org_id int;
begin
  org_id := (
    select id from organizations
    where word_chars_only( organizations.name ) = word_chars_only( org_name )
    limit 1
  );

  if ( org_id is null ) THEN
    insert into organizations ( name ) values ( org_name )
      returning id into org_id;
  end if;

  return org_id;
end;
$$ language plpgsql;

create or replace function organization_user_adoption( org_id int, u_id int )
returns void as $$
begin
  insert into organizations_users ( organization_id, user_id )
    select org_id, u_id
    where not exists (
      select * from organizations_users ou
      where ou.organization_id = org_id
        and ou.user_id = u_id
    );
end;
$$ language plpgsql;


-- Need to pick a delivery service based on probabilities
-- Source: http://stackoverflow.com/questions/13040246/select-random-row-from-a-postgresql-table-with-weighted-row-probabilities
-- NOTE: Probabilities _NEED_ to add up to 1
create or replace function update_order_delivery_service_id( oid int )
returns void as $$
  declare ds_id int;
begin
  ds_id := get_random_delivery_service_id( oid );

  update orders
    set delivery_service_id = ds_id
    where id = oid
      and delivery_service_id is null;
end;
$$ language plpgsql;


-- Need to pick a delivery service based on probabilities
-- Source: http://stackoverflow.com/questions/13040246/select-random-row-from-a-postgresql-table-with-weighted-row-probabilities
-- NOTE: Probabilities _NEED_ to add up to 1
create or replace function get_random_delivery_service_id( oid int )
returns int as $$
  declare preferred_delivery_services int[];
begin
  -- Get the user's preferred delivery services
  select array(
    select user_courier_preferences.delivery_service_id
    from orders
    left join user_courier_preferences on
      user_courier_preferences.user_id = orders.user_id
    where orders.id = oid
  ) into preferred_delivery_services;

  -- None specified? Then load in all services available for the order
  -- 
  -- NOTE: This does not take into account the delivery zip.
  --       In the future, we should do this
  if preferred_delivery_services[1] is null then
    select array(
      select delivery_services.id
      from orders
      left join restaurants
        on restaurants.id = orders.restaurant_id
      left join delivery_services
        on delivery_services.region_id = restaurants.region_id
      where orders.id = oid
    ) into preferred_delivery_services;
  end if;

  raise notice '%', preferred_delivery_services;

  return (
    with
     computed_weights as (
        select random() * sum( ds.region_order_distribution ) r
        from delivery_services ds
        where id = any( preferred_delivery_services )
      )

    select id from (
      select ds.id, r, sum( ds.region_order_distribution ) over ( order by ds.id ) s
      from delivery_services ds
      cross join computed_weights
      where ds.id = any( preferred_delivery_services )
    ) q
    where s >= r
    order by id
    limit 1
  );
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

-- NOTE:  This function is subject to small rounding errors because we
--        round into an integer each time multiplication happens with
--        some sort of rate (like tax). We _should_ round only at the
--        very end of the calculations. The margin of error is not very
--        large, so we'll deal with it later.
create or replace function update_order_totals( o orders )
returns void as $$
  declare tax_rate          numeric;
  declare delivery_fee      int := 0;
  declare sub_total         int := 0;
  declare sales_tax         int := 0;
  declare total             int := 0;
  declare restaurant_total  int := 0;
  declare r_sales_tax       int := 0;
  declare no_contract_amt   int := 0;
begin
  sub_total   := order_sub_total( o );
  sub_total   := sub_total + order_amenities_total( o );
  total       := sub_total + coalesce( o.adjustment_amount, 0 );

  -- Values for restaurant_total and total can diverge
  -- since there are user specific adjustements now
  -- We repeat operations for the two values
  restaurant_total  := total;
  total             := total + o.user_adjustment_amount;

  delivery_fee := order_delivery_fee( o );

  -- Only add delivery fee to restaurant total if they're delivering
  if o.type = 'delivery' then
    restaurant_total := restaurant_total + delivery_fee;
  end if;

  total := total + delivery_fee;

  if not order_is_tax_exempt( o ) then
    tax_rate        := order_tax_rate( o );
    sales_tax       := round( total * tax_rate );
    r_sales_tax     := round( restaurant_total * tax_rate );
  end if;

  total             := total + sales_tax + o.tip;
  restaurant_total  := restaurant_total + r_sales_tax;

  -- Only add tip if it was pickup or delivery
  if o.type != 'courier' then
    restaurant_total := restaurant_total + o.tip;
  end if;

  no_contract_amt  := round( order_no_contract_rate( o ) * total );
  total            := total + no_contract_amt;

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
    || 'sub_total = $2, '
    || 'total = $3, '
    || 'sales_tax = $4, '
    || 'delivery_fee = $5, '
    || 'restaurant_total = $6, '
    || 'restaurant_sales_tax = $7, '
    || 'no_contract_amount = $8 '
    || 'where id = $1'
    using o.id, sub_total, total
    , sales_tax, delivery_fee
    , restaurant_total, r_sales_tax
    , no_contract_amt;
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

create or replace function set_order_default_location( oid int )
returns void as $$
  declare o orders;
begin
  for o in ( select * from orders where id = oid )
  loop
    perform set_order_default_location( o );
    return;
  end loop;
end;
$$ language plpgsql;

create or replace function set_order_default_location( o orders )
returns void as $$
begin
  update orders
    set restaurant_location_id = (
      select id from restaurant_locations rl
        where rl.restaurant_id = orders.restaurant_id
          and rl.is_default = true
    )
    where orders.id = o.id;
end;
$$ language plpgsql;

create or replace function set_order_feedback( o orders )
returns void as $$
begin
  insert into order_feedback (order_id)
    select id from orders where id = o.id;
end;
$$ language plpgsql;

create or replace function update_restaurant_text_id( rid int )
returns void as $$
  declare num_existing int;
begin
  update restaurants set text_id = get_restaurant_text_id( rid )
    where id = rid;
end;
$$ language plpgsql;

create or replace function get_restaurant_text_id( rid int )
returns text as $$
  declare rname text;
begin
  select restaurants.name from restaurants
    where id = rid
    into rname;
  return get_restaurant_text_id( rid, str_to_slug( rname ), 0 );
end;
$$ language plpgsql;

create or replace function get_restaurant_text_id( rid int, new_text_id text, idx int )
returns text as $$
  declare modified_text_id text;
  declare num_existing int;
begin
  modified_text_id := new_text_id;

  if idx > 0 then
    modified_text_id := new_text_id || '-' || idx;
  end if;

  select count(*) into num_existing
  from restaurants
  where text_id = modified_text_id
    and id != rid;

  if num_existing = 0 then
    return modified_text_id;
  else
    return get_restaurant_text_id( rid, new_text_id, idx + 1 );
  end if;
end;
$$ language plpgsql;

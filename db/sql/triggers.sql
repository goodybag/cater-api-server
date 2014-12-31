drop trigger if exists on_order_amenities_update on order_amenities;
create trigger on_order_amenities_update
  after insert or update
  on order_amenities
  for each row
  execute procedure on_order_amenities_update();

drop trigger if exists on_order_amenities_remove on order_amenities;
create trigger on_order_amenities_remove
  after delete
  on order_amenities
  for each row
  execute procedure on_order_amenities_remove();

drop trigger if exists on_order_create on orders;
create trigger on_order_create
    after insert
    on orders
    for each row
    execute procedure on_order_create();

drop trigger if exists order_total_change on orders;
create trigger order_total_change
    after insert or update of zip, tip, adjustment_amount, user_adjustment_amount, restaurant_location_id
    on orders
    for each row
    execute procedure on_order_total_change();

drop trigger if exists on_order_type_change on orders;
create trigger on_order_type_change
    after update of type
    on orders
    for each row
    execute procedure on_order_type_change();

drop trigger if exists orders_search_update on orders;
create trigger orders_search_update
  after update of name
  on orders
  for each row
  execute procedure update_orders_search_vector_from_orders();

drop trigger if exists orders_search_update on restaurants;
create trigger orders_search_update
  after update of name
  on restaurants
  for each row
  execute procedure update_orders_search_vector_from_restaurants();

drop trigger if exists orders_search_update on users;
create trigger orders_search_update
  after update of name, email, organization
  on users
  for each row
  execute procedure update_orders_search_vector_from_users();

drop trigger if exists restaurants_search_update on restaurants;
create trigger restaurants_search_update
  after update of name
  on restaurants
  for each row
  execute procedure update_restaurant_search_vector();

drop trigger if exists restaurant_locations_is_default_change on restaurant_locations;
create trigger restaurant_locations_is_default_change
  after insert or update of is_default
  on restaurant_locations
  for each row
  when ( NEW.is_default is true )
  execute procedure restaurant_locations_is_default_change();

drop trigger if exists on_restaurant_name_change on orders;
create trigger on_restaurant_name_change
    after insert or update of name
    on restaurants
    for each row
    execute procedure on_restaurant_name_change();
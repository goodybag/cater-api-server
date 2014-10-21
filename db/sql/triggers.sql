drop trigger if exists on_order_create on orders;
create trigger on_order_create
    after insert
    on orders
    for each row
    execute procedure on_order_create();

drop trigger if exists order_total_change on orders;
create trigger order_total_change
    after insert or update of zip, tip, adjustment_amount, user_adjustment_amount
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

drop trigger if exists on_order_items_change on order_items;
create trigger on_order_items_change
  after insert or update of quantity, price, options_sets
  on order_items
  for each row
  execute procedure on_order_items_change();

drop trigger if exists on_order_items_remove on order_items;
create trigger on_order_items_remove
  after delete
  on order_items
  for each row
  execute procedure on_order_items_remove();

drop trigger if exists on_order_datetime_change on orders;
create trigger on_order_datetime_change
  after insert or update of datetime
  on orders
  for each row
  execute procedure on_order_datetime_change();
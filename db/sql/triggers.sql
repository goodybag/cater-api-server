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

drop trigger if exists restaurants_search_update on restaurants;
create trigger restaurants_search_update
  after update of name
  on restaurants
  for each row
  execute procedure update_restaurant_search_vector();

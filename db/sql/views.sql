create or replace view orders_search_view as
  select 
    orders.id as order_id,
    orders.name as order_name,
    restaurants.name as restaurant_name,
    users.name as user_name,
    users.email as user_email,
    users.organization as user_organization
  from orders 
  join restaurants on orders.restaurant_id = restaurants.id
  join users on orders.user_id = users.id;
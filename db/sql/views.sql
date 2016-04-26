create or replace view orders_search_view as
  select
    orders.id as order_id,
    orders.name as order_name,
    restaurants.name as restaurant_name,
    restaurants.id as restaurant_id,
    users.id as user_id,
    users.name as user_name,
    users.email as user_email,
    users.organization as user_organization
  from orders
  join restaurants on orders.restaurant_id = restaurants.id
  join users on orders.user_id = users.id;

CREATE OR REPLACE VIEW region_delivery_zips AS (
  SELECT rdz.zip, rg.id as region_id
  FROM restaurant_delivery_zips rdz
  JOIN restaurants rs ON rs.id = rdz.restaurant_id
  JOIN regions rg ON rg.id = rs.region_id
  WHERE rdz.zip IS NOT NULL
  AND rg.id IS NOT NULL
  GROUP BY rg.id, rdz.zip
);

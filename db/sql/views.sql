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

CREATE OR REPLACE VIEW latest_order_revisions AS (
  SELECT DISTINCT ON (orv.order_id) orv.*
  FROM order_revisions orv
  ORDER BY orv.order_id, orv.created_at DESC
);

CREATE OR REPLACE VIEW order_notification_history AS (
  SELECT id, nid, user_id, order_id, data::jsonb, created_at, 'null'::jsonb AS error
  FROM order_notifications
  UNION ALL
  SELECT id, nid, user_id, order_id, data, created_at, error
  FROM order_notification_failures
);

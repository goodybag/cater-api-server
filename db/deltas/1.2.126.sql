insert into deltas ( version, date ) values ( '1.2.126', now() );
create index concurrently idx_items_restaurant_id on items("restaurant_id");
create index concurrently idx_order_items_order_id on order_items("order_id");
create index concurrently idx_order_statuses_order_id on order_statuses("order_id");
create index concurrently idx_order_revisions_order_id on order_revisions("order_id");
create index concurrently idx_order_revisions_user_id on order_revisions("user_id");
create index concurrently idx_orders_user_id on orders("user_id");

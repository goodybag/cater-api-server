-- Update version
insert into deltas (version, date) values ('1.0.1', 'now()');

-- Set item_id to null on item delete
alter table "order_items" alter column "item_id" drop not null;
alter table "order_items" drop constraint "order_items_item_id_fkey";
alter table "order_items" add constraint "order_items_item_id_fkey"
  foreign key ("item_id") references "items"("id") on delete set null;

-- Just null out the restaurant_id on delete
-- We will likely not drop a restaurant unless it's necessary (test data most likely)
alter table "orders" alter column "restaurant_id" drop not null;
alter table "orders" drop constraint "orders_restaurant_id_fkey";
alter table "orders" add constraint "orders_restaurant_id_fkey"
  foreign key ("restaurant_id") references "restaurants"("id") on delete set null;

-- Drop item when category is deleted
alter table "items" drop constraint "items_category_id_fkey";
alter table "items" add constraint "items_category_id_fkey"
  foreign key ("category_id") references "categories"("id") on delete cascade;

-- Drop item when restaurant is deleted
alter table "items" drop constraint "items_restaurant_id_fkey";
alter table "items" add constraint "items_restaurant_id_fkey"
  foreign key ("restaurant_id") references "restaurants"("id") on delete cascade;

-- Drop lead times when restaurant is deleted
alter table "restaurant_lead_times" drop constraint "restaurant_lead_times_restaurant_id_fkey";
alter table "restaurant_lead_times" add constraint "restaurant_lead_times_restaurant_id_fkey"
  foreign key ("restaurant_id") references "restaurants"("id") on delete cascade;

-- Drop delivery zips when restaurant is deleted
alter table "restaurant_delivery_zips" drop constraint "restaurant_delivery_zips_restaurant_id_fkey";
alter table "restaurant_delivery_zips" add constraint "restaurant_delivery_zips_restaurant_id_fkey"
  foreign key ("restaurant_id") references "restaurants"("id") on delete cascade;

-- Drop delivery times when restaurant is deleted
alter table "restaurant_delivery_times" drop constraint "restaurant_delivery_times_restaurant_id_fkey";
alter table "restaurant_delivery_times" add constraint "restaurant_delivery_times_restaurant_id_fkey"
  foreign key ("restaurant_id") references "restaurants"("id") on delete cascade;

-- Drop categories when restaurant is deleted
alter table "categories" drop constraint "categories_restaurant_id_fkey";
alter table "categories" add constraint "categories_restaurant_id_fkey"
  foreign key ("restaurant_id") references "restaurants"("id") on delete cascade;

-- Delta

DO $$
  declare version       text := '1.2.37';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table orders
    drop constraint if exists "orders_user_id_fkey",
    add constraint "orders_user_id_fkey" FOREIGN KEY (user_id)
      REFERENCES users(id) on delete cascade;

  alter table users_groups
    drop constraint if exists "users_groups_user_id_fkey",
    add constraint "users_groups_user_id_fkey" FOREIGN KEY (user_id)
      REFERENCES users(id) on delete cascade;

  alter table order_statuses
    drop constraint if exists "order_statuses_order_id_fkey",
    add constraint "order_statuses_order_id_fkey" FOREIGN KEY (order_id)
      REFERENCES orders(id) on delete cascade;

  alter table payment_summary_items
    drop constraint if exists "payment_summary_items_order_id_fkey",
    add constraint "payment_summary_items_order_id_fkey" FOREIGN KEY (order_id)
      REFERENCES orders(id) on delete cascade;

end$$;
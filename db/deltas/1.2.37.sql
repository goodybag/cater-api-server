-- Delta

DO $$
  declare version       text := '1.2.37';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();


  alter table orders
    alter column user_id drop not null,
    drop constraint if exists "orders_user_id_fkey",
    add constraint "orders_user_id_fkey" FOREIGN KEY (user_id)
      REFERENCES users(id) on delete set null;

  alter table payment_summary_items
    drop constraint if exists "payment_summary_items_order_id_fkey",
    add constraint "payment_summary_items_order_id_fkey" FOREIGN KEY (order_id)
      REFERENCES orders(id) on delete set null;

  alter table password_resets
    drop constraint if exists "password_resets_user_id_fkey",
    add constraint "password_resets_user_id_fkey" FOREIGN KEY (user_id)
      REFERENCES users(id) on delete cascade;
end$$;
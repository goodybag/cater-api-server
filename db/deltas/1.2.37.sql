-- Delta

DO $$
  declare version       text := '1.2.37';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table orders
    drop constraint if exists "orders_user_id_fkey",
    add constraint "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) on delete restrict;
end$$;
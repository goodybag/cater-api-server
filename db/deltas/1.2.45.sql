-- Delta

DO $$
  declare version       text := '1.2.45';
  declare o             orders;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Fix our triggers and such
  -- These are getting renamed because of the typo
  drop trigger if exists order_order_items_change on order_items;
  drop trigger if exists order_order_items_remove on order_items;

  -- Drop this trigger so we can alter the type
  drop trigger if exists on_order_datetime_change on orders;
  -- it will get added back in triggers.sql

  alter table orders alter column datetime type timestamp with time zone;

  for o in ( select * from orders order by id asc )
  loop
    raise notice 'Updating Order #%', o.id;
    update orders set datetime = o.datetime at time zone o.timezone where id = o.id;
  end loop;
end$$;
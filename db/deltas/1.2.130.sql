-- Delta

DO $$
  declare version       text := '1.2.130';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists invoiced_order_payment_transfers (
    id                  serial primary key
  , order_id            int references orders( id ) on delete cascade
  , restaurant_id       int references restaurants( id ) on delete cascade
  , stripe_transfer_id  citext
  , error               jsonb
  , created_at          timestamp not null default now()
  );

  create index invoiced_order_payment_transfers_order_id_idx
    on invoiced_order_payment_transfers( order_id );

  create index invoiced_order_payment_transfers_restaurant_id_idx
    on invoiced_order_payment_transfers( restaurant_id );
end$$;

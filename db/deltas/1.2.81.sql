-- Delta

DO $$
  declare version       text := '1.2.81';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  DROP TABLE IF EXISTS "order_types";
  CREATE TABLE IF NOT EXISTS "order_types" (
    id              serial primary key
  , created_at      timestamptz not null default now()
  , order_id        int references orders(id) on delete set null
  , user_id         int references users(id) on delete set null
  , type            order_type not null default 'delivery'::order_type
  );

end$$;

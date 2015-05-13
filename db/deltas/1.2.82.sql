-- Delta

DO $$
  declare version       text := '1.2.82';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  DROP TABLE IF EXISTS "order_feeback";
  CREATE TABLE IF NOT EXISTS "order_feedback" (
    id          serial primary key
  , created_at  timestamptz not null default now()
  , order_id    int not null references orders(id) on delete cascade
  , question    text
  , rating      int
  );
end$$;
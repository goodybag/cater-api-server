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
  , order_id    int references orders(id) on delete set null
  , question    text
  , answer      text
  );
end$$;
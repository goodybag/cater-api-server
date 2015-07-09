-- Delta

DO $$
  declare version       text := '1.2.94';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop table if exists order_internal_notes;
  create table if not exists order_internal_notes (
    id          serial primary key
  , order_id    int references orders(id)
  , body        text not null default ''
  , created_at  timestamp not null default now()
  );
end$$;
-- Delta

DO $$
  declare version       text := '1.2.121';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table order_revisions (
    id                  serial primary key
  , order_id            int references orders(id)
    -- For extra indexing power
  , user_id             int references users(id)
    -- User who initiated the revision
  , actor_id            int references users(id)
    -- Something we can use to identify what category of change occurred
    -- Eventually, we may want to make this an enum type
    -- like (add_item, remove_item, update_quantity, etc.)
  , description         text
  , data                jsonb not null default '{}'::jsonb
  , created_at          timestamp without time zone not null default now()
  );
end$$;

-- Delta

DO $$
  declare version       text := '1.2.114';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop table if exists order_collaborators;

  create table order_collaborators(
    id                text primary key default uuid_generate_v4()
  , order_id          int references orders(id) on delete set null
  , user_id           int references users(id) on delete set null
  , error             json
  , last_notified_at  timestamp
  , created_at        timestamp not null default now()
  );

  -- if not exists (
  --   select 1 where constraint_exists( 'order_collaborators_order_id_user_id_key'
  -- ) is true ) then
  --   alter table order_collaborators
  --     add constraint order_collaborators_order_id_user_id_key unique( "order_id", "user_id" );
  -- end if;
end$$;
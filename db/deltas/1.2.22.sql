-- Delta

DO $$
  declare version       text := '1.2.22';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop table if exists "users_redemptions";

  create table if not exists "users_redemptions" (
    id              serial primary key
  , created_at      timestamp not null default now()
  , user_id         int not null references users(id) on delete cascade
  , location        text
  , amount          int not null default 0
  , cost            int not null default 0
  );
end$$;
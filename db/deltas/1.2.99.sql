-- Delta for creating "requested_restaurants" table

DO $$
  declare version       text := '1.2.99';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "requested_restaurants" (
    id            serial primary key
  , created_at    timestamp not null default now()
  , user_id       int references users(id) on delete cascade
  , votes         int check(votes > 0) default 0
  , restaurant    text not null
  );

end$$;

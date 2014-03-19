-- #738 favorite restaurants

DO $$
  declare version       text := '1.2.3';

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "favorite_restaurants" (
    id            serial primary key
  , created_at    timestamp not null default now()
  , user_id       int references users(id) on delete cascade
  , restaurant_id int references restaurants(id) on delete cascade
  , unique (user_id, restaurant_id)
  );

end$$;

-- Delta

DO $$
  declare version       text := '1.2.82';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop type if exists signup_status cascade;
  create type signup_status as enum('pending', 'completed', 'failed');

  drop table if exists "restaurant_signups";
  create table if not exists "restaurant_signups" (
    id serial primary key
  , created_at timestamp not null default now()
  , restaurant_id   int references restaurants(id) on delete cascade
  , data json
  , status signup_status default 'pending'
  , step int not null default 1
  );
end$$;

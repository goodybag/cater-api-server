-- Delta

DO $$
  declare version       text := '1.2.81';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

<<<<<<< HEAD
  DROP TABLE IF EXISTS "order_types";
  CREATE TABLE IF NOT EXISTS "order_types" (
    id              serial primary key
  , created_at      timestamptz not null default now()
  , order_id        int references orders(id) on delete set null
  , user_id         int references users(id) on delete set null
  , type            order_type not null default 'delivery'::order_type
  );

end$$;
=======
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
>>>>>>> 9ca7e5740146982d07007cd9d94aaa72f202d6b7

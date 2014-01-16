-- #599 Reminders/notifications

DO $$
  declare version       text := '1.1.10';

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Fix created_at for reminders table
  -- since production runs w/timezone GMT we don't need to update any rows
  ALTER TABLE reminders
    ALTER COLUMN created_at TYPE timestamptz
  ;

  INSERT INTO groups (name) VALUES ('restaurant');

  create table if not exists "users_restaurants" (
    id            serial primary key
  , created_at    timestamptz not null default now()
  , user_id       int not null references users(id) on delete cascade
  , restaurant_id int not null references restaurants(id) on delete cascade
  );

end$$;
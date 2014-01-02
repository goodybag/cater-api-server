-- #613 restaurant availability

DO $$
  declare version       text := '1.1.10';

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "restaurant_events" (
    id            serial primary key
  , restaurant_id int references restaurants(id) on delete cascade
  , created_at    timestamp not null default now()
  , name          text not null
  , description   text
  , date_range    daterange not null
  , closed        boolean not null
  );

end$$;

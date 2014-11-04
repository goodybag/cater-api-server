-- Delta

DO $$
  declare version       text := '1.2.46';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop table if exists amenities cascade;
  create table if not exists amenities (
    id            serial primary key
  , created_at    timestamptz not null default now()
  , name          text
  , description   text
  , price         int not null default 0
  , restaurant_id int not null references restaurants(id) on delete cascade
  , scale         amenity_scale default 'flat'
  , enabled       boolean default false
  );

  drop table if exists order_amenities;
  create table if not exists order_amenities (
    id            serial primary key
  , created_at    timestamptz not null default now()
  , order_id      int not null references orders(id) on delete cascade
  , amenity_id    int not null references amenities(id) on delete cascade
  );

end$$;

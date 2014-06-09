-- #860 Admin Panel Photos

DO $$
  declare version       text := '1.2.13';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "restaurant_photos" (
    "id"            serial
  , "created_at"    timestamp not null default now()
  , "restaurant_id" int not null references restaurants( id ) on delete cascade
  , "url"           text not null
  , "name"          text
  , "description"   text
  , "priority"      int
  );
end$$;
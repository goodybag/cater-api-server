-- Delta

DO $$
  declare version       text := '1.2.78';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop table if exists "restaurant_notes";

  create table if not exists "restaurant_notes" (
    id              serial primary key
  , created_at      timestamp not null default now()
  , restaurant_id   int not null references restaurants(id) on delete cascade
  , user_id         int references restaurants(id) on delete set null
  , note            text
  );
end$$;

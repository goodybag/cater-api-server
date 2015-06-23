-- Delta

DO $$
  declare version       text := '1.2.88';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop table if exists restaurant_verifications;
  create table if not exists "restaurant_verifications" (
    id            serial primary key,
    created_at    timestamptz not null default now(),
    restaurant_id int not null references restaurants(id) on delete cascade,
    data          json
  );

  perform add_column( 'restaurants', 'uuid', 'UUID NOT NULL DEFAULT uuid_generate_v4()' );
end$$;
-- Delta

DO $$
  declare version       text := '1.2.74';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  INSERT INTO groups (name) VALUES ('accounting');

  create table if not exists restaurant_payments (
    id            serial primary key
  , created_at    timestamp not null default now()
  , restaurant_id int references restaurants(id) on delete cascade
  , amount        int not null
  , error         text
  );
end$$;

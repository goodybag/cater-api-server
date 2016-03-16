-- Delta

DO $$
  declare version       text := '1.2.121';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists promos (
    promo_code          citext primary key
  , type                text not null
  , name                text not null
  , description         text
  , data                jsonb not null default '{}'::jsonb
  , recipients          text[] not null
  , expires_on          timestamptz
  , created_at          timestamptz not null default now()
  );

  create table if not exists promos_applied (
    id                  serial primary key
  , promo_id            citext not null references promos(promo_code) on delete cascade
  , order_id            int not null references orders(id) on delete cascade
  , created_at          timestamptz not null default now()
  );

end$$;

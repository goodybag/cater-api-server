-- #798 - Notifications

DO $$
  declare version       text := '1.2.10';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  DROP TYPE IF EXISTS email_status;
  CREATE TYPE email_status AS ENUM('pending', 'delivered', 'error');

  create table if not exists "order_notifications" (
    "id"            serial

    -- Registered text ID of notification
  , "nid"           text not null
  , "order_id"      int references orders( id ) on delete set null
  , "email"         json
  , "send_date"     timestamp not null default now()
  , "created_at"    timestamp not null default now()
  );
end$$;
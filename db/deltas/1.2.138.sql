-- Delta

DO $$
  declare version       text := '1.2.138';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  CREATE TABLE IF NOT EXISTS order_notification_failures
  ( id         SERIAL
  , nid        CITEXT NOT NULL
  , order_id   INT REFERENCES orders (id) ON DELETE SET NULL
  , user_id    INT REFERENCES users (id) ON DELETE SET NULL
  , data       JSONB NOT NULL DEFAULT '{}'
  , error      JSONB NOT NULL DEFAULT '{}'
  , created_at TIMESTAMP NOT NULL DEFAULT now()
  );
end$$;

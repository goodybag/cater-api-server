-- Delta

DO $$
  declare version       text := '1.2.112';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  CREATE EXTENSION citext;

  CREATE TABLE IF NOT EXISTS features (
    id         CITEXT PRIMARY KEY -- hard-codable slug identifier for the feature
  , created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  , rollout_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01T00:00:00Z'
  , name       TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS features_users (
    feature_id CITEXT NOT NULL REFERENCES features (id) ON DELETE CASCADE
  , user_id    INT NOT NULL REFERENCES users (id) ON DELETE CASCADE
  , created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  , data       JSON NOT NULL DEFAULT '{}'
  , CONSTRAINT features_users_pkey PRIMARY KEY (feature_id, user_id)
  );

  INSERT INTO features (id, name) VALUES ('search-intro', 'Search Page Introduction');
end$$;

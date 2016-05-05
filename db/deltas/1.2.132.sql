-- Delta

DO $$
  declare version       text := '1.2.132';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  ALTER TABLE order_revisions ADD COLUMN details JSONB NOT NULL DEFAULT '{}';
end$$;

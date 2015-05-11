-- Delta

DO $$
  declare version       text := '1.2.80';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  ALTER TABLE restaurant_notes DROP CONSTRAINT restaurant_notes_user_id_fkey;
  ALTER TABLE restaurant_notes ADD CONSTRAINT restaurant_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;
end$$;

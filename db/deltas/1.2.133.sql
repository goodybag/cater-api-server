-- Delta

DO $$
  declare version       text := '1.2.133';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  ALTER TABLE restaurants ADD COLUMN show_item_recipients BOOLEAN NOT NULL DEFAULT TRUE;
end$$;

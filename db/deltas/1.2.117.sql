-- Delta

DO $$
  declare version       text := '1.2.117';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table orders drop column if exists edit_token_expires;
  alter table orders alter column edit_token set default uuid_generate_v4();
  update orders
    set edit_token = uuid_generate_v4()
    where edit_token is null;
end$$;
-- Delta

DO $$
  declare version       text := '1.2.35';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop function get_delivery_fee( rid int, delivery_zip varchar(5), delivery_date timestamp, guests int );
end$$;
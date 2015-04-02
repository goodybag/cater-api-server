-- Delta

DO $$
  declare version       text := '1.2.72';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop function update_restaurant_text_id( rid int, new_text_id text );
  drop function update_restaurant_text_id( rid int, new_text_id text, idx int );
end$$;

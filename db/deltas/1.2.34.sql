-- Delta

DO $$
  declare version       text := '1.2.34';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  alter table orders drop column if exists search_vector;
  alter table orders add column search_vector tsvector;

  update orders as o 
  set search_vector = to_tsvector( 'english', 
      o.id                 || ' ' ||
      coalesce(o.name, '') || ' ' ||
      coalesce(r.name, '') || ' ' ||
      coalesce(u.name, '') || ' ' ||
      coalesce(u.email, '')|| ' ' ||
      coalesce(u.organization, '') || ' ' 
    )
  from restaurants as r, users as u
  where o.restaurant_id = r.id
  and o.user_id = u.id;

  create index orders_search_idx on
    orders using gin( search_vector );

end$$;

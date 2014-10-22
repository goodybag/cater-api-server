-- Delta

DO $$
  declare version       text := '1.2.45';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'restaurants', 'search_vector', 'tsvector' );

  update restaurants as r
  set search_vector = to_tsvector( 'english',
    r.name
  );

  create index restaurants_search_idx on restaurants using gin( search_vector );
end$$;

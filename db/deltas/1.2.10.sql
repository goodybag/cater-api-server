-- Allow scheduled series

DO $$
  declare version       text := '1.2.10';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'scheduled_jobs', 'predicate_id', 'integer references scheduled_jobs(id)' );
end$$;
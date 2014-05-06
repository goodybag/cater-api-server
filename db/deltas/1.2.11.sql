-- Allow scheduled series

DO $$
  declare version       text := '1.2.11';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  perform add_column( 'scheduled_jobs', 'predicate_id', 'integer references scheduled_jobs(id)' );

  alter table scheduled_jobs alter column status set default 'pending';
  alter table scheduled_jobs alter column datetime set default now();
end$$;
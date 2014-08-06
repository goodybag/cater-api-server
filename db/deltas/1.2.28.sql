-- #1032 - index scheduled_jobs

DO $$
  declare version       text := '1.2.28';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop index if exists scheduled_jobs_status_idx;
  create index scheduled_jobs_status_idx on scheduled_jobs (status);

  drop index if exists scheduled_jobs_action_idx;
  create index scheduled_jobs_action_idx on scheduled_jobs (action);
end$$;
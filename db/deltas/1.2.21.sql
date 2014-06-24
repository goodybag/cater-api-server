-- #960

DO $$
  declare version       text := '1.2.21';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  update restaurant_lead_times set cancel_time = 0 where cancel_time is null;

  alter table restaurant_lead_times
    alter column cancel_time set not null,
    alter column cancel_time set default 0,
    alter column lead_time set default 0,
    alter column max_guests set default 0;
end$$;
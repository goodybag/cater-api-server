-- #80X scheduler

DO $$
 declare version       text := '1.2.8';

begin
 raise notice '## Running Delta v% ##', version;

 -- Update version
 execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

 DROP TYPE IF EXISTS job_status;
 CREATE TYPE job_status AS ENUM('pending', 'in-progress', 'completed', 'error');

 CREATE TABLE IF NOT EXISTS "scheduled_jobs" (
   id              serial primary key
 , created_at      timestamp not null default now()
 , action          text
 , data            json
 , status          job_status
 );

end$$;

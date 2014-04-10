-- #80X scheduler

DO $$
 declare version       text := '1.2.8';

begin
 raise notice '## Running Delta v% ##', version;

 -- Update version
 execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

 DROP TYPE IF EXISTS job_status cascade;
 CREATE TYPE job_status AS ENUM('pending', 'in-progress', 'completed', 'failed');

 DROP TABLE IF EXISTS "scheduled_jobs";
 CREATE TABLE IF NOT EXISTS "scheduled_jobs" (
   id              serial primary key
 , created_at      timestamptz not null default now()
 , action          text
 , data            json
 , status          job_status
 , datetime        timestamptz
 );

end$$;

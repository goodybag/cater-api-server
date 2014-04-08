-- #80X scheduler

DO $$
 declare version       text := '1.2.8';

begin
 raise notice '## Running Delta v% ##', version;

 -- Update version
 execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

 create table if not exists "scheduled-jobs" (
   id              serial primary key
 , created_at      timestamp not null default now()
 , action          text
 , data            data
 );

end$$;

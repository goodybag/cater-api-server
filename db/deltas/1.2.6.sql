--- #772 restaurant contacts

DO $$
 declare version       text := '1.2.6';

begin
 raise notice '## Running Delta v% ##', version;

 -- Update version
 execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

 create table if not exists "contacts" (
   id              serial primary key
 , created_at      timestamp not null default now()
 , restaurant_id   int references restaurants(id) on delete cascade
 , name            text
 , sms_phones      varchar(10)[] default '{}' not null
 , voice_phones    varchar(10)[] default '{}' not null
 , emails          text[]        default '{}' not null
 , notify          boolean default false
 , notes           text
 );

end$$;
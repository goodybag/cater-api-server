-- #343 Pickup orders

DO $$
  declare version text := '1.2.0';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "locations" (
    id              serial primary key
  , restaurant_id   int references restaurants ("id")
  , name            text
  , lat             double precision default 0
  , lon             double precision default 0
  , street          text
  , street2         text
  , city            text check ( city similar to '[[:digit:]]{5}' )
  , state           varchar(2)
  , zip             varchar(5)
  , sms_phones      varchar(10)[]
  , voice_phones    varchar(10)[]
  , emails          text[]
  , is_hidden       boolean not null default true
  , created_at      time with time zone not null default now()
  );

  create table if not exists "locations_hours_of_operation" (
    id              serial primary key
  , location_id     int references locations ("id") on delete cascade
  , day             int not null check ( day >= 0 and day <= 6 )
  , start_time      time without time zone not null
  , end_time        time without time zone not null
  , created_at      time with time zone not null default now()
  );

  perform add_column( 'orders', 'pickup_person_name',   'text' );
  perform add_column( 'orders', 'pickup_person_phone',  'character varying(10)' );
  perform add_column( 'orders', 'pickup_location_id',   'int references locations("id")' );
  perform add_column( 'orders', 'is_pickup',            'boolean not null default false' );

  perform add_column( 'restaurants', 'allows_pickup',   'boolean not null default true' );
end$$;

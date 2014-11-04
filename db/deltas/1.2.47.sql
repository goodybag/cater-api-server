-- Delta

DO $$
  declare version       text := '1.2.47';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists "cuisines" ();

  perform add_column( 'cuisines', 'id', 'serial' );
  perform add_column( 'cuisines', 'created_at', 'timestamp not null default now()' );
  perform add_column( 'cuisines', 'name', 'text' );

  insert into cuisines (name) values ('American')
    , ('Asian Fusion')
    , ('BBQ')
    , ('Bakery')
    , ('Burgers')
    , ('Cajun/Creole')
    , ('Chinese')
    , ('Food Truck')
    , ('French')
    , ('Healthy')
    , ('Hot Dogs')
    , ('Indian')
    , ('Italian')
    , ('Japanese')
    , ('Korean')
    , ('Mediterranean')
    , ('Mexican')
    , ('Pizza')
    , ('Salads')
    , ('Sandwiches')
    , ('Seafood')
    , ('Southern')
    , ('Tex-Mex')
    , ('Thai')
    , ('Vietnamese')
    , ('Wings');

end$$;
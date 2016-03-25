-- Delta

DO $$
  declare version       text := '1.2.126';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBNASH75', '', '', '{ "debbiegarcia@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBREFNASH', '', '', '{ "debbiegarcia@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBAUSTIN15', '', '', '{ "jacob.parker@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBREFATX', '', '', '{ "jacob.parker@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBSEA15', '', '', '{ "ramonejohnson@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBREFSEA', '', '', '{ "ramonejohnson@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBFREESEA', '', '', '{ "ramonejohnson@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'SEATTLEGB', '', '', '{ "ramonejohnson@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBHOU15', '', '', '{ "virginiasims@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBHOU25', '', '', '{ "virginiasims@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBHOU50', '', '', '{ "virginiasims@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBREFHOU', '', '', '{ "virginiasims@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'NASH$50', '', '', '{ "debbiegarcia@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'NASH$25', '', '', '{ "debbiegarcia@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBATX50', '', '', '{ "jacob.parker@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GB25Austin', '', '', '{ "jacob.parker@goodybag.com" }' );

  insert into promos
    ( promo_code, type, name, recipients )
    values
    ( 'GBNASH50', '', '', '{ "debbiegarcia@goodybag.com" }' );

end$$;

-- Delta

DO $$
  declare version       text := '1.2.115';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
  create table "promo_codes" (
      id            serial primary key
    , created_at    timestamp not null default now()
    , promo_code    text
    , expires_at    timestamp
    , email         text not null
  );

  insert into promo_codes (email, promo_code) values ('adam.peacock@goodybag.com', 'g315b');
  insert into promo_codes (email, promo_code) values ('adam.peacock@goodybag.com', 'gbsea15');
  insert into promo_codes (email, promo_code) values ('adam.peacock@goodybag.com', 'gb315');
  insert into promo_codes (email, promo_code) values ('adam.peacock@goodybag.com', 'gb518');
  insert into promo_codes (email, promo_code) values ('adam.peacock@goodybag.com', 'gbhou0818');
  insert into promo_codes (email, promo_code) values ('adam.peacock@goodybag.com', 'gbhou15');

  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'goodybag315');
  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'gb415');
  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'gbaustin15');
  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'gbstar15');
  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'gbamaz15');
  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'gbfree0715');
  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'gbgift0815');
  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'gbfreesea');
  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'gbatx75');
  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'gbhou75');
  insert into promo_codes (email, promo_code) values ('jacobparker@goodybag.com', 'gbausfree');

  insert into promo_codes (email, promo_code) values ('christymedlock@goodybag.com', 'gbfree0715');

  insert into promo_codes (email, promo_code) values ('Debbiegarcia@goodybag.com', 'gbnash75');

  insert into promo_codes (email, promo_code) values ('virginiasims@goodybag.com', 'gbhou75');

  insert into promo_codes (email, promo_code) values ('ramonejohnson@goodybag.com', 'seattlegb');
  insert into promo_codes (email, promo_code) values ('ramonejohnson@goodybag.com', 'seagoody');
  insert into promo_codes (email, promo_code) values ('ramonejohnson@goodybag.com', 'gbseafree');
  insert into promo_codes (email, promo_code) values ('ramonejohnson@goodybag.com', 'gbsea75');

  insert into promo_codes (email, promo_code) values ('om@goodybag.com', 'bv250');



end$$;

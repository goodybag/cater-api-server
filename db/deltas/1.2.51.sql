-- Delta

DO $$
  declare version       text := '1.2.51';
  declare rid           int;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  if not exists ( select id from regions where name = 'Seattle, WA' )
  then
    insert into regions ( name, state, cities, sales_tax, timezone )
      values ( 'Seattle, WA', 'WA', Array['Seattle'], 0.095, 'America/Los_Angeles' )
      returning id into rid;

    insert into region_zips ( region_id, zip ) values
      ( rid, 98101 ), ( rid, 98102 ), ( rid, 98103 ), ( rid, 98104 )
    , ( rid, 98105 ), ( rid, 98106 ), ( rid, 98107 ), ( rid, 98108 )
    , ( rid, 98109 ), ( rid, 98111 ), ( rid, 98112 ), ( rid, 98113 )
    , ( rid, 98114 ), ( rid, 98115 ), ( rid, 98116 ), ( rid, 98117 )
    , ( rid, 98118 ), ( rid, 98119 ), ( rid, 98121 ), ( rid, 98122 )
    , ( rid, 98124 ), ( rid, 98125 ), ( rid, 98126 ), ( rid, 98127 )
    , ( rid, 98129 ), ( rid, 98131 ), ( rid, 98132 ), ( rid, 98133 )
    , ( rid, 98134 ), ( rid, 98136 ), ( rid, 98138 ), ( rid, 98139 )
    , ( rid, 98141 ), ( rid, 98144 ), ( rid, 98145 ), ( rid, 98146 )
    , ( rid, 98148 ), ( rid, 98154 ), ( rid, 98155 ), ( rid, 98158 )
    , ( rid, 98160 ), ( rid, 98161 ), ( rid, 98164 ), ( rid, 98165 )
    , ( rid, 98166 ), ( rid, 98168 ), ( rid, 98170 ), ( rid, 98171 )
    , ( rid, 98174 ), ( rid, 98175 ), ( rid, 98177 ), ( rid, 98178 )
    , ( rid, 98181 ), ( rid, 98184 ), ( rid, 98185 ), ( rid, 98188 )
    , ( rid, 98190 ), ( rid, 98191 ), ( rid, 98194 ), ( rid, 98195 )
    , ( rid, 98198 ), ( rid, 98199 );
  end if;

end$$;
-- Delta

DO $$
  declare default_region_id int;
  declare default_region    text := 'Austin, TX';
  declare version           text := '1.2.23';
begin
  raise notice '## Running Delta v% ##', version;

  create table if not exists region_zips ();

  perform add_column( 'region_zips', 'id', 'serial primary key' );
  perform add_column( 'region_zips', 'region_id', 'int references regions( id ) not null' );
  perform add_column( 'region_zips', 'zip', 'character varying(5) not null' );

  if not exists ( select 1 where constraint_exists( 'region_zips_region_id_zip_key' ) is true )
  then
  alter table region_zips
    add constraint region_zips_region_id_zip_key unique ( region_id, zip );
  end if;

  select id into default_region_id from regions where name = default_region;

  delete from region_zips
    where region_id = default_region_id
    and zip in (
      '76530', '78610', '78613', '78617', '78626', '78628', '78634', '78641', '78642', '78645', '78652', '78653', '78660', '78664'
    , '78665', '78669', '78681', '78701', '78702', '78703', '78704', '78705', '78712', '78717', '78719', '78721', '78722', '78723'
    , '78724', '78725', '78726', '78727', '78728', '78729', '78730', '78731', '78732', '78733', '78734', '78735', '78736', '78737'
    , '78738', '78739', '78741', '78742', '78744', '78745', '78746', '78747', '78748', '78749', '78750', '78751', '78752', '78753'
    , '78754', '78755', '78756', '78757', '78758', '78759', '78831', '79719'
    );

  insert into region_zips ( region_id, zip ) values
    ( default_region_id, 76530 ), ( default_region_id, 78610 ), ( default_region_id, 78613 ), ( default_region_id, 78617 )
  , ( default_region_id, 78626 ), ( default_region_id, 78628 ), ( default_region_id, 78634 ), ( default_region_id, 78641 )
  , ( default_region_id, 78642 ), ( default_region_id, 78645 ), ( default_region_id, 78652 ), ( default_region_id, 78653 )
  , ( default_region_id, 78660 ), ( default_region_id, 78664 ), ( default_region_id, 78665 ), ( default_region_id, 78669 )
  , ( default_region_id, 78681 ), ( default_region_id, 78701 ), ( default_region_id, 78702 ), ( default_region_id, 78703 )
  , ( default_region_id, 78704 ), ( default_region_id, 78705 ), ( default_region_id, 78712 ), ( default_region_id, 78717 )
  , ( default_region_id, 78719 ), ( default_region_id, 78721 ), ( default_region_id, 78722 ), ( default_region_id, 78723 )
  , ( default_region_id, 78724 ), ( default_region_id, 78725 ), ( default_region_id, 78726 ), ( default_region_id, 78727 )
  , ( default_region_id, 78728 ), ( default_region_id, 78729 ), ( default_region_id, 78730 ), ( default_region_id, 78731 )
  , ( default_region_id, 78732 ), ( default_region_id, 78733 ), ( default_region_id, 78734 ), ( default_region_id, 78735 )
  , ( default_region_id, 78736 ), ( default_region_id, 78737 ), ( default_region_id, 78738 ), ( default_region_id, 78739 )
  , ( default_region_id, 78741 ), ( default_region_id, 78742 ), ( default_region_id, 78744 ), ( default_region_id, 78745 )
  , ( default_region_id, 78746 ), ( default_region_id, 78747 ), ( default_region_id, 78748 ), ( default_region_id, 78749 )
  , ( default_region_id, 78750 ), ( default_region_id, 78751 ), ( default_region_id, 78752 ), ( default_region_id, 78753 )
  , ( default_region_id, 78754 ), ( default_region_id, 78755 ), ( default_region_id, 78756 ), ( default_region_id, 78757 )
  , ( default_region_id, 78758 ), ( default_region_id, 78759 ), ( default_region_id, 78831 ), ( default_region_id, 79719 );

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
end$$;
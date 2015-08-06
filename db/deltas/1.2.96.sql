-- Delta

DO $$
  declare version       text := '1.2.96';
  declare virtual_org   record;
  declare user_rec      users;
  declare org           record;

begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop table if exists "organizations" cascade;
  create table "organizations" (
    id            serial primary key
  , name          text not null
  , created_at        timestamp not null default now()
  );

  drop table if exists "organizations_users";
  create table "organizations_users" (
    organization_id   int references organizations(id) on delete cascade
  , user_id           int references users(id) on delete cascade
  , created_at        timestamp not null default now()
  );

  alter table "organizations_users" add primary key ( organization_id, user_id );

  -- Loop over existing distinct organizations
  for virtual_org in (
    select
      distinct coerced.org_id
    , coerced.organization as name
    from (
      select
        word_chars_only( organization ) as org_id
      , organization
      from users
      where organization is not null
        and organization != ''
    ) coerced
  ) loop

    -- Create a new organization
    insert into organizations ( name )
      values ( virtual_org.name )
      returning * into org;

    -- Lookup users in this organization
    for user_rec in (
      select * from users
      where word_chars_only( organization ) = virtual_org.org_id
    ) loop
      -- Associate user to organization
      insert into organizations_users ( organization_id, user_id )
        values ( org.id, user_rec.id );
    end loop;
  end loop;
end$$;
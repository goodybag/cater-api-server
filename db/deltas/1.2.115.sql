-- Delta

DO $$
  declare version       text := '1.2.115';
  declare r             record;
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  drop table if exists order_collaborators;

  create table order_collaborators(
    id                text primary key default uuid_generate_v4()
  , order_id          int references orders(id) on delete set null
  , user_id           int references users(id) on delete set null
  , error             json
  , last_notified_at  timestamp
  , created_at        timestamp not null default now()
  );

  create table partial_registrations(
    id                serial primary key
  , user_id           int references users(id) on delete cascade
  , token             text not null default uuid_generate_v4()
  , has_consumed      boolean not null default false
  , created_at        timestamp not null default now()
  );

  perform add_column( 'orders', 'organization_id', 'int references organizations(id) on delete set null' );
  perform add_column( 'users', 'default_organization_id', 'int references organizations(id) on delete set null' );
  perform add_column( 'organizations', 'domain_name', 'text' );

  -- For each organization
  -- Set the org domain name equal to one of the users
  -- email domain name.
  -- Also, update users default_organization_id for those
  -- currently in an organization
  for r in (
    select distinct on (organizations.id)
      organizations.id, users.email
    from organizations
    left join organizations_users ou on ou.organization_id = organizations.id
    left join users on ou.user_id = users.id
  ) loop
    update organizations
      set domain_name = get_domain_from_email( r.email )
      where id = r.id;

    update users
      set default_organization_id = r.id
      where id in (
        select user_id from organizations_users
        where organization_id = r.id
      );
  end loop;
end$$;
-- Delta

DO $$
  declare version       text := '1.2.64';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
  
  perform add_column('users', 'organization_type', 'text default null');

  -- Update users organization_type if they already have set organization
  update users
    set
      organization_type='business'
    where organization is not null and organization_type is null;

end$$;
-- Insert the user and group for building receipts

DO $$
  declare version       text := '1.0.15';
  declare group_name    text := 'receipts';
  declare user_email    text := 'receipts@goodybag.com';
  declare user_password text := '$2a$10$8egVetFrE7OAk1B.v36dOOdhS9TXt98PN7/zCvLdeAuOa0KLXIzIi';
  declare receipt_user  record;
begin
  raise notice '## Running Delta v% ##', version;

  raise notice 'Using group_name: %, email: %, password: %', group_name, user_email, user_password;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  -- Insert group
  if not exists ( select 1 from groups where name = group_name ) then
    raise notice 'inserting group `%`', group_name;
    execute 'insert into groups ( name ) values ( $1 )' using group_name;
  end if;

  -- Insert user
  if not exists ( select 1 from users where users.email = user_email ) then
    raise notice 'inserting user `%`', user_email;

    for receipt_user in execute 'insert into users (email, password) values ($1, $2) returning *'
      using user_email, user_password
    loop
      -- Insert users_groups
      if not exists ( select 1 from users_groups where users_groups.user_id = receipt_user.id and "group" = group_name ) then
        raise notice 'inserting users_groups user_id: `%` group: `%`', receipt_user.id, group_name;

        execute 'insert into users_groups ( "group", user_id ) values ($1, $2)'
          using group_name, receipt_user.id;
      end if;
    end loop;
  end if;
end$$;
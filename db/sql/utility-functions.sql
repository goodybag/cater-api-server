-----------------------
-- Utility Functions --
-----------------------

CREATE OR REPLACE FUNCTION is_timezone( tz TEXT ) RETURNS BOOLEAN as $$
  DECLARE date TIMESTAMPTZ;
BEGIN
  date := now() AT TIME ZONE tz;
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END;
$$ language plpgsql STABLE;

create or replace function str_to_slug( str text )
returns text as $$
begin
  str := replace( lower( str ), ' ', '-' );
  return regexp_replace( str, E'[^\\w -]', '', 'g' );
end;
$$ language plpgsql;
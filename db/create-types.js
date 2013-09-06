var
  db = require('./index')
, async = require('async')
;

// custom types

//custom type - order_status

var types = {
  order_status: function(callback) {
    db.query("DROP TYPE IF EXISTS order_status; CREATE TYPE order_status AS ENUM('canceled', 'pending', 'submitted', 'denied', 'accepted', 'delivered');", callback);
  }
, timezone: function(callback) {
    db.query("CREATE OR REPLACE FUNCTION is_timezone( tz TEXT ) RETURNS BOOLEAN as $$ DECLARE date TIMESTAMPTZ; BEGIN date := now() AT TIME ZONE tz; RETURN TRUE; EXCEPTION WHEN OTHERS THEN RETURN FALSE; END; $$ language plpgsql STABLE; DROP DOMAIN IF EXISTS timezone; CREATE DOMAIN timezone AS TEXT CHECK ( is_timezone( value ) );", callback);
  }
};

var done = function(error) {
  console.log( (error) ? "Error creating types" : "Successfully created types");
  console.log(error);
  process.exit(0);
}

async.series(types, done);
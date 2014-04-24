var
  db = require('../')
, async = require('async')
;

var cli = false;

// custom types

//custom type - order_status

var types = {
  order_status: function(callback) {
    db.query("DROP TYPE IF EXISTS order_status; CREATE TYPE order_status AS ENUM('canceled', 'pending', 'submitted', 'denied', 'accepted', 'delivered');", callback);
  }
, payment_method: function(callback) {
    db.query("DROP TYPE IF EXISTS payment_method; CREATE TYPE payment_method AS ENUM('card', 'bank');", callback);
  }
, payment_type: function(callback) {
    db.query("DROP TYPE IF EXISTS payment_type; CREATE TYPE payment_type AS ENUM('debit', 'credit');", callback);
  }
, payment_status: function(callback) {
    db.query("DROP TYPE IF EXISTS payment_status; CREATE TYPE payment_status AS ENUM('pending', 'processing', 'paid', 'invoiced', 'error');", callback);
  }
, timezone: function(callback) {
    db.query("CREATE OR REPLACE FUNCTION is_timezone( tz TEXT ) RETURNS BOOLEAN as $$ DECLARE date TIMESTAMPTZ; BEGIN date := now() AT TIME ZONE tz; RETURN TRUE; EXCEPTION WHEN OTHERS THEN RETURN FALSE; END; $$ language plpgsql STABLE; DROP DOMAIN IF EXISTS timezone; CREATE DOMAIN timezone AS TEXT CHECK ( is_timezone( value ) );", callback);
  }
, tip_percentage: function(callback) {
    db.query("DROP TYPE IF EXISTS tip_percentage; CREATE TYPE tip_percentage AS ENUM('0', 'custom', '5', '10', '15', '18', '20', '25');", callback);
  }
, email_status: function(callback) {
    db.query("DROP TYPE IF EXISTS email_status; CREATE TYPE email_status AS ENUM('pending', 'delivered', 'error');", callback);
, job_status: function(callback) {
    db.query("DROP TYPE IF EXISTS job_status; CREATE TYPE job_status AS ENUM('pending', 'in-progress', 'completed', 'failed');", callback);
  }
};

var done = function(callback) {
  return function(error, results) {
    console.log( (error) ? "Error creating types" : "Successfully created types");
    if(error) console.log(error);
    if (cli) return process.exit( (error) ? 1 : 0 );
    else if(callback) callback(error, results);
  }
};

module.exports.run = function(callback) {
  async.series(types, done(callback));
};

if (require.main === module) {
  cli = true;
  module.exports.run();
}

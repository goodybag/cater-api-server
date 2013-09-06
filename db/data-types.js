var db = require('./index');

var arg = function(type) {
  return function() {

    var args = Array.prototype.slice.call(arguments);
    if (args.length==0) return type;
    return type + '(' + args.join(',') + ')';
  }
}

// custom types

//custom type - order_status
db.query("CREATE TYPE order_status AS ENUM('canceled', 'pending', 'submitted', 'denied', 'accepted', 'delivered');", function(){});

// custom type - timezone
db.query("CREATE OR REPLACE FUNCTION is_timezone( tz TEXT ) RETURNS BOOLEAN as $$ DECLARE date TIMESTAMPTZ; BEGIN date := now() AT TIME ZONE tz; RETURN TRUE; EXCEPTION WHEN OTHERS THEN RETURN FALSE; END; $$ language plpgsql STABLE;", function(){});
db.query("CREATE DOMAIN timezone AS TEXT CHECK ( is_timezone( value ) );", function(){});

module.exports = {
  bigint: 'int8'
, int8: 'int8'
, bigserial: 'serial8'
, serial8: 'serial8'
, bit: arg('bit')
, varbit: arg('varbit')
, boolean: 'boolean'
, bool: 'boolean'
, bytea: 'bytea'
, varchar: arg('varchar')
, cidr: 'cidr'
, circle: 'circle'
, date: 'date'
, float8: 'float8'
, inet: 'inet'
, integer: 'int'
, int4: 'int'
, int: 'int'
, interval: arg('interval')
, line: 'line'
, lseg: 'lseg'
, macaddr: 'macaddr'
, money: 'money'
, numeric: arg('numeric')
, path: 'path'
, point: 'point'
, polygon: 'polygon'
, real: 'real'
, float4: 'real'
, smallint: 'int2'
, int2: 'int2'
, smallserial: 'serial2'
, serial2: 'serial2'
, serial: 'serial'
, serial4: 'serial'
, text: 'text'
, time: arg('time')
, timetz: arg('timetz')
, timestamp: 'timestamp'
, timestamptz: arg('timestamptz')
, tsquery: 'tsquery'
, tsvector: 'tsvector'
, txidSnapshot: 'txid_snapshot'
, uuid: 'uuid'
, xml: 'xml'
, json: 'json'
, orderstatus: 'order_status'
, 'timezone': 'timezone'
}

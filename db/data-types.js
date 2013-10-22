var db = require('./index');

var arg = function(type) {
  return function() {

    var args = Array.prototype.slice.call(arguments);
    if (args.length==0) return type;
    return type + '(' + args.join(',') + ')';
  }
}

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

  // custom types
, orderstatus: 'order_status'
, timezone: 'timezone'
, paymentmethod: 'payment_method'
, paymenttype: 'payment_type'
}

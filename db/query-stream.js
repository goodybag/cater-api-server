var config      = require('../config');
var pg          = require('pg');
var QueryStream = require('pg-query-stream');

/*
* @param {String} query
* @param {Array} value
* @param {Function} handler - stream handler
*/

module.exports = function (query, value, handler) {
  if (typeof value === "function") {
    handler = value;
    value = [];
  }

  pg.connect(config.postgresConnStr, function (error, client, done) {
    if (error) {
      return handler(error);
    }

    var query = new QueryStream(query, value);
    var stream = client.query(query);
    stream.on('end', done);

    return handler(null, stream);
  });
};

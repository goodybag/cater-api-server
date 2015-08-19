var fs = require('fs');
var path = require('path');
var db = require('../');

exports.run = createExtensions;

function createExtensions(cb) {
  var fileName = path.join(__dirname, '/../sql/extensions.sql');

  fs.readFile(fileName, 'utf-8', function(err, fixtures) {
    if (err) return cb(err);

    db.query(fixtures, function(err) {
      if (err) return cb(err);

      console.log('Successfully created extensions');
      cb();
    });
  });
};

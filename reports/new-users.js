var utils = require('../utils');
var models = require('../models');
var moment = require('moment');
var fs = require('fs');
var range = process.argv.slice(2);
var start = range[0] || '2012-01-01';
var end = range[1] || moment().format('YYYY-MM-DD');

console.log('Generating list of new users from', start, 'to', end);
var filename = 'new-users-' + start+'-'+end+'.csv';
console.log('Writing to ',filename);
var writeStream = fs.createWriteStream(filename);

var query = {
  where: { 
    created_at: { 
      $gte: start
    , $lte: end
    }
  }
};

var wrap = function(str, wrapper) { 
  wrapper = wrapper || '"';
  return str ? wrapper+str+wrapper : '';
}

writeStream.write('Email, First Name, Last Name, Company Name\n');
models.User.find(query, function(err, results) {
  utils.each(results, function(user) {
    user = user.attributes;
    var idx = (user.name||'').indexOf(' ');
    writeStream.write([
      wrap(user.email)
    , wrap(user.name && user.name.slice(0, idx))
    , wrap(user.name && user.name.slice(idx+1))
    , wrap(user.organization)+'\n'
    ].join(','));
  });
});

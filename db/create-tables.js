var
  async = require('async')
, utils = require('./utils')
;

var definitions = [
  'users'
, 'restaurants'
, 'menus'
, 'menu-categories'
];


var iterator = function(name, callback){
  utils.createTable(require('./definitions/'+name), notify(name, callback));
}

var notify =  function(name, callback) {
  return function(error, response){
    if (error) return callback(error);
    console.log('Successfully created table:', name);
    return callback();
  }
};

var done = function(error, results) {
  if (error) return console.log(error);
}

async.mapSeries(definitions, iterator, done);
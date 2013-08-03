var
  fs = require('fs')
, async = require('async')
, utils = require('./utils')
;

var definitions = [
  'users'
, 'restaurants'
, 'menu-categories'
, 'menu-items'
, 'orders'
, 'order-items'
];

// var definitions = fs.readdirSync(__dirname + '/definitions');

var iterator = function(name, callback){
  utils.createTable(require('./definitions/'+name), notify(name, callback));
}

var notify =  function(name, callback) {
  return function(error, response){
    if (error) {
      console.log('Error creating table:', name);
      return callback(error);
    }
    console.log('Successfully created table:', name);
    return callback();
  }
};

var done = function(error, results) {
  if (error) return console.log(error);
}

async.mapSeries(definitions, iterator, done);
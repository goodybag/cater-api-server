var
  fs = require('fs')
, async = require('async')
, utils = require('./utils')
;

var definitions = [
  'users'
, 'restaurants'
, 'restaurant-lead-times'
, 'restaurant-delivery-zips'
, 'restaurant-delivery-times'
, 'orders'
, 'categories'
, 'items'
, 'order-items'
, 'order-statuses'
];

// var definitions = fs.readdirSync(__dirname + '/definitions');

var messages = {
  createTable: {
    success: 'Successfully created table:'
  , error: 'Error creating table for:'
  }
, dropIndex: {
    success: 'Successfully droped indicies for table:'
  , error: 'Error droping index for table:'
  }
, createIndex: {
    success: 'Successfully created indicies for table:'
  , error: 'Error creating index for table:'
  }
}

var iterator = function(name, callback){
  async.series([
    // create table
    function(cb) {
      utils.createTable(require('./definitions/'+name), notify(name, messages.createTable, cb));
    }
    // drop index
  , function(cb) {
      utils.dropIndex(require('./definitions/'+name), notify(name, messages.dropIndex, cb));
    }
    // create index
  , function(cb) {
      utils.createIndex(require('./definitions/'+name), notify(name, messages.createIndex, cb));
    }
  ], function(error, results) {
      callback(error, results);
  });
}

var notify =  function(name, message, callback) {
  return function(error, response){
    if (error) {
      console.log(message.error, name);
      return callback(error);
    }
    console.log(message.success, name);
    return callback();
  }
};

var done = function(error, results) {
  if (error) return console.log(error);
  process.exit(0);
}

async.mapSeries(definitions, iterator, done);

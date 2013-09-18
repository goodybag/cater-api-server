var
  fs = require('fs')
, async = require('async')
, utils = require('./utils')
;

var definitions = [
  'users'
, 'groups'
, 'users-groups'
, 'restaurants'
, 'restaurant-lead-times'
, 'restaurant-delivery-zips'
, 'restaurant-delivery-times'
, 'orders'
, 'categories'
, 'items'
, 'order-items'
, 'order-statuses'
, 'password-resets'
, 'waitlist'
, 'options-sets'
, 'options'
, 'order-options-sets'
, 'order-options'
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

var done = function(callback) {
  return function(error, results) {
    console.log( (error) ? "Error creating tables" : "Successfully created tables");
    if (error) console.log(error);
    if (cli) return process.exit( (error) ? 1 : 0 );
    else if(callback) callback(error, results);
  }
};

module.exports.run = function(callback) {
  async.mapSeries(definitions, iterator, done(callback));
};

if (require.main === module) {
  var cli = true;
  module.exports.run();
}

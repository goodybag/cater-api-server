var
  async = require('async')
, faker = require('Faker')

  db = require('../db')
;

faker.definitions.phone_formats.push('##########');

// number of records to create
var records = 100;

var query = function(query, callback) {
  var sql = db.builder.sql(query);
  // console.log(sql.query, sql.values);
  db.query(sql.query, sql.values, function(error, results) {
    if (error) console.log('error inserting record into the table', error, sql.query, sql.values);
    callback(error, results);
  });
}

var incrementHolder = {};
var incrementer = function(key, starting) {
  if(incrementHolder[key] == null){
    incrementHolder[key] = starting;
    return starting;
  }
  return ++incrementHolder[key];
}

var select = function(table) {
  return {
    type:'select'
  , table: table
  }
}

var inserts = {
  restaurants: function() {
    return {
      type:'insert'
    , table: 'restaurants'
    , values: {
        name: faker.Company.companyName()
      , street: faker.Address.streetAddress()
      , city: faker.Address.city()
      , state: faker.Address.usState(true)
      , zip: faker.Address.zipCodeFormat(0)
      , phone: parseInt(faker.PhoneNumber.phoneNumberFormat(faker.definitions.phone_formats.length-1))
      , price: faker.Helpers.randomNumber(4) + 1
      }
    }
  }
, categories: function(restaurant_id) {
    return {
      type:'insert'
    , table: 'categories'
    , values: {
        restaurant_id: restaurant_id
      , name: faker.Lorem.words()[0]
      , description: faker.Lorem.sentence()
      , order: incrementer('categories_order_'+restaurant_id, 1)
      }
    }
  }
, items: function(restaurant_id, category_id) {
    return {
      type:'insert'
    , table: 'items'
    , values: {
        category_id: category_id
      , order: incrementer('items_order_'+restaurant_id+'_'+category_id, 1)
      , name: faker.Lorem.words()[0]
      , description: faker.Lorem.sentence()
      , price: faker.Helpers.randomNumber(1000)
      , feeds_min: 3
      , feeds_max: 5
      }
    }
  }
}

async.series(
  {
    restaurants: function(cb) {
      async.timesSeries(10, function(n, callback){
        query(inserts.restaurants(), callback);
      }, function(error, results){
        // console.log('called1');
        cb(error);
      });
    }
  , categories: function(cb) {
      query(select('restaurants'), function(error, results){
        async.timesSeries(results.length, function(n, callback){
          async.timesSeries(10, function(x, callback2){
            query(inserts.categories(results[n].id), callback2);
          }, function(error, results){
            // console.log('called-sub-2');
            callback(error);
          });
        }, function(error, results){
          // console.log('called2');
          cb(error);
        });
      });
    }
  , items: function(cb) {
      query(select('categories'), function(error, results){
        async.timesSeries(results.length, function(n, callback){
          async.timesSeries(10, function(x, callback2){
            query(inserts.items(results[n].restaurant_id, results[n].id), callback2);
          }, function(error, results){
            // console.log('called-sub-3');
            callback(error);
          });
        }, function(error, results){
          // console.log('called3');
          cb(error);
        });
      });
    }
  , userGroups: function(cb) {
      async.series({
        clients: function(callback) {
          query({
            type: 'insert'
          , table: 'groups'
          , values: {name: 'client'}
          }, callback);
        }
      , admins: function(callback) {
          query({
            type: 'insert'
          , table: 'groups'
          , values: {name: 'admin'}
          }, callback);
        }
      }, cb)
    }
  }
, function(error, results){
  console.log('done');
  process.exit(0);
  }
);

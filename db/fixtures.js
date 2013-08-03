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
var incrementer = function(key, starting){
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
      }
    }
  }
, menu_categories: function(restaurant_id) {
    return {
      type:'insert'
    , table: 'menu_categories'
    , values: {
        restaurant_id: restaurant_id
      , name: faker.Lorem.words()[0]
      , description: faker.Lorem.sentence()
      , order: incrementer('menu_categories_order_'+restaurant_id, 1)
      }
    }
  }
, menu_items: function(restaurant_id, menu_category_id) {
    return {
      type:'insert'
    , table: 'menu_items'
    , values: {
        restaurant_id: restaurant_id
      , menu_category_id: menu_category_id
      , order: incrementer('menu_items_order_'+restaurant_id+'_'+menu_category_id, 1)
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
  , menu_categories: function(cb) {
      query(select('restaurants'), function(error, results){
        async.timesSeries(results.length, function(n, callback){
          async.timesSeries(10, function(x, callback2){
            query(inserts.menu_categories(results[n].id), callback2);
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
  , menu_items: function(cb) {
      query(select('menu_categories'), function(error, results){
        async.timesSeries(results.length, function(n, callback){
          async.timesSeries(10, function(x, callback2){
            query(inserts.menu_items(results[n].restaurant_id, results[n].id), callback2);
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
  }
, function(error, results){
  console.log('done');
  process.exit(0);
  }
);

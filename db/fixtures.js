var
  async = require('async')
, faker = require('Faker')

  db = require('../db')
;

faker.definitions.phone_formats.push('##########');

// number of records to create
var records = 100;

var austinZipCodes = [
78610,78613,78617,78641,78652,78653,78660,78664,78681,78701,78702,
78703,78704,78705,78712,78717,78719,78721,78722,78723,78724,78725,
78726,78727,78728,78729,78730,78731,78732,78733,78734,78735,78736,
78737,78738,78739,78741,78742,78744,78745,78746,78747,78748,78749,
78750,78751,78752,78753,78754,78756,78757,78758,78759];

var arrayRandomize = function() {return 0.5 - Math.random()};

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
, restaurantLeadTimes: function(restaurant_id, max_guests, hours) {
    return {
      type: 'insert'
    , table: 'restaurant_lead_times'
    , values: {
        restaurant_id: restaurant_id
      , max_guests: max_guests
      , hours: hours
      }
    }
  }
, restaurantDeliveryZips: function(restaurant_id, zip) {
    return {
      type: 'insert'
    , table: 'restaurant_delivery_zips'
    , values: {
        restaurant_id: restaurant_id
      , zip: zip
      }
    }
  }
}

async.series(
  {
    restaurants: function(cb) {
      console.log("populating restaurants");
      async.timesSeries(10, function(n, callback){
        query(inserts.restaurants(), callback);
      }, function(error, results){
        // console.log('called1');
        cb(error);
      });
    }
  , categories: function(cb) {
      console.log("populating categories");
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
      console.log("populating items");
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
  , restaurantLeadTimes: function(cb) {
      console.log("populating restaurant_lead_times");
      query(select('restaurants'), function(error, results){
        async.timesSeries(results.length, function(n, callback){
          async.series({
            '50-guests-24-hours': function(callback2){query(inserts.restaurantLeadTimes(results[n].id, 50, 24), callback2);}
          , '100-guests-48-hours': function(callback2){query(inserts.restaurantLeadTimes(results[n].id, 100, 48), callback2);}
          , '300-guests-72-hours': function(callback2){query(inserts.restaurantLeadTimes(results[n].id, 300, 72), callback2);}
          }, function(error, results){
              // console.log('called-sub-4');
              callback(error);
          });
        }, function(error, results){
          // console.log('called4');
          cb(error);
        });
      });
    }
  , restaurantDeliveryZips: function(cb) {
      console.log("populating restaurant_delivery_zips");
      query(select('restaurants'), function(error, results){
        async.timesSeries(results.length, function(n, callback){
          austinZipCodes.sort(arrayRandomize);
          async.timesSeries(10, function(x, callback2){
            query(inserts.restaurantDeliveryZips(results[n].id, austinZipCodes[x]), callback2);
          }, function(error, results){
            // console.log('called-sub-3');
            callback(error);
          });
        }, function(error, results){
          // console.log('called4');
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

var utils = require('../utils');
var faker = require('Faker');
var config = require('../config');
var db = require('../db');

var fakeCategories = [
  'Breakfast'
, 'Lunch'
, 'Dinner'
, 'Tacos'
, 'Plates'
, 'Tour De France'
, 'Crepes'
];

fakeCategories.random = function(){
  return fakeCategories[
    parseInt( Math.random() * fakeCategories.length )
  ];
};

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

var randomTime = function(maxHours, maxMinutes) {
  return utils.map(utils.map([maxHours || 24, maxMinutes || 60], faker.random.number), function(i) { return ('0' + i).slice(-2); }).join(':');
}

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
    var query =  {
      type:'insert'
    , table: 'restaurants'
    , values: {
        name: faker.Company.companyName()
      , street: faker.Address.streetAddress()
      , city: faker.Address.city()
      , state: faker.Address.usState(true)
      , zip: faker.Address.zipCodeFormat(0)
      , sms_phone: config.testPhoneSms || parseInt(faker.PhoneNumber.phoneNumberFormat(faker.definitions.phone_formats.length-1))
      , voice_phone: config.testPhoneVoice || parseInt(faker.PhoneNumber.phoneNumberFormat(faker.definitions.phone_formats.length-1))
      , email: config.testEmail || faker.Internet.email()
      , price: faker.Helpers.randomNumber(5) + 1
      , cuisine: faker.Lorem.words(faker.Helpers.randomNumber(4))
      }
    };
    if (Math.random() < .3) query.values.minimum_order = faker.Helpers.randomNumber(501) * 100;
    return query;
  }
, categories: function(restaurant_id) {
    return {
      type:'insert'
    , table: 'categories'
    , values: {
        restaurant_id: restaurant_id
      , name: fakeCategories.random() //faker.Lorem.words()[0]
      , description: faker.Lorem.sentence()
      , order: incrementer('categories_order_'+restaurant_id, 1)
      }
    }
  }
, items: function(restaurant_id, category_id) {
    var item = {
      type:'insert'
    , table: 'items'
    , values: {
        category_id: category_id
      , order: incrementer('items_order_'+restaurant_id+'_'+category_id, 1)
      , name: faker.Lorem.words().slice(0, parseInt( Math.random() * 4 ) + 1 ).join(' ')
      , description: faker.Lorem.sentence()
      , price: faker.Helpers.randomNumber(1000)
      , feeds_min: 3
      , feeds_max: 5
      }
    }

    if ( item.values.name ){
      item.values.name = item.values.name[0].toUpperCase() + item.values.name.substring(1);
    }

    if ( item.values.description ){
      item.values.description = item.values.description[0].toUpperCase() + item.values.description.substring(1);
    }

    return item;
  }
, restaurantLeadTimes: function(restaurant_id, max_guests, lead_time) {
    return {
      type: 'insert'
    , table: 'restaurant_lead_times'
    , values: {
        restaurant_id: restaurant_id
      , max_guests: max_guests
      , lead_time: lead_time
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
, restaurantDeliveryTimes: function(restaurant_id, day, start, end) {
    end = end || randomTime();
    start = start || randomTime.apply(randomTime, (utils.map(end.split(':'), function(i) { return parseInt(i); })));
    return {
      type: 'insert'
    , table: 'restaurant_delivery_times'
    , values: {
        restaurant_id: restaurant_id
      , day: day
      , start_time: start
      , end_time: end
      }
    }
  }
}

utils.async.series(
  {
    restaurants: function(cb) {
      console.log("populating restaurants");
      utils.async.timesSeries(10, function(n, callback){
        query(inserts.restaurants(), callback);
      }, function(error, results){
        // console.log('called1');
        cb(error);
      });
    }
  , categories: function(cb) {
      console.log("populating categories");
      query(select('restaurants'), function(error, results){
        utils.async.timesSeries(results.length, function(n, callback){
          utils.async.timesSeries(10, function(x, callback2){
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
        utils.async.timesSeries(results.length, function(n, callback){
          utils.async.timesSeries(10, function(x, callback2){
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
        utils.async.timesSeries(results.length, function(n, callback){
          var max1 = Math.floor(Math.random() * 50)+50;
          var max2 = Math.floor(Math.random() * 50)+50+max1;
          var max3 = Math.floor(Math.random() * 50)+50+max2;
          utils.async.series({
            '24-hours': function(callback2){query(inserts.restaurantLeadTimes(results[n].id, max1 , 24), callback2);}
          , '48-hours': function(callback2){query(inserts.restaurantLeadTimes(results[n].id, max2, 48), callback2);}
          , '72-hours': function(callback2){query(inserts.restaurantLeadTimes(results[n].id, max3, 72), callback2);}
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
        utils.async.timesSeries(results.length, function(n, callback){
          austinZipCodes.sort(arrayRandomize);
          utils.async.timesSeries(10, function(x, callback2){
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
  , restaurantDeliveryTimes: function(cb) {
      console.log('populating restaurant_delivery_times');
      query(select('restaurants'), function(error, results) {
        if (error) return cb(error);
        utils.async.each(results, function(restaurant, callback) {
          var days = utils.first(utils.shuffle(utils.range(7)), faker.random.number(7));
          utils.async.each(days, function(day, callback2) {
            query(inserts.restaurantDeliveryTimes(restaurant.id, day), callback2);
          }, callback)
        }, cb);
      });
    }
  , userGroups: function(cb) {
      console.log("populating user groups");
      utils.async.series({
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
  , users: function(cb) {
      console.log("populating users");
      utils.async.waterfall([
        utils.partial(utils.encryptPassword, 'password')
      , function(hash, salt, callback) {
          query({
            type: 'insert'
          , table: 'users'
          , values: {email: 'admin@goodybag.com', password: hash}
          , returning: ['id']
          }, callback);
        }
      , function(rows, callback) {
          query({
            type: 'insert'
          , table: 'users_groups'
          , values: {user_id: rows[0].id, group: 'admin'}
          }, callback);
        }
      ], cb);
    }
  }
, function(error, results) {
  console.log('done');
  process.exit(0);
  }
);

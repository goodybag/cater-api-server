if ( process.argv.indexOf('--test') > -1 ){
  process.env['GB_ENV'] = 'test';
}

var utils = require('../utils');
var faker = require('Faker');
var config = require('../config');
var db = require('../db');

var _ = utils._;

var delivery_fees = [
  1000
, 1500
, 3000
];

var fakeCategories = [
  'Breakfast'
, 'Lunch'
, 'Dinner'
, 'Tacos'
, 'Plates'
, 'Tour De France'
, 'Crepes'
];

var fakeOptions = [
  {
    "name": "Toppings"
  , "type": "checkbox"
  , "options": [
      { "name": "Pepperoni",  "price": 150, "default_state": false }
    , { "name": "Mushrooms",  "price": 100, "default_state": false }
    , { "name": "Olives",     "price": 100, "default_state": false }
    , { "name": "Chicken",    "price": 200, "default_state": false }
    , { "name": "Jalapenos",  "price": 100, "default_state": false }
    ]
  }
, {
    "name": "Fixin's"
  , "type": "checkbox"
  , "options": [
      { "name": "Lettuce",    "price": 0,   "default_state": true }
    , { "name": "Tomato",     "price": 0,   "default_state": true }
    , { "name": "Onion",      "price": 0,   "default_state": true }
    , { "name": "Pickles",    "price": 0,   "default_state": true }
    , { "name": "Ketkhup",    "price": 0,   "default_state": true }
    , { "name": "Mustard",    "price": 0,   "default_state": true }
    , { "name": "Mayo",       "price": 0,   "default_state": false }
    , { "name": "Jalapenos",  "price": 50,  "default_state": false }
    , { "name": "Mushroooms", "price": 50,  "default_state": false }
    ]
  }
, {
    "name": "Buns"
  , "type": "radio"
  , "options": [
      { "name": "White",    "price": 0,   "default_state": false }
    , { "name": "Wheat",    "price": 0,   "default_state": true }
    , { "name": "Rye",      "price": 50,  "default_state": false }
    ]
  }
];

var fakeCreditCards= [
  {type: 'visa',          number: '4111111111111111',   securityCode: '123'}
, {type: 'mastercard',    number: '5105105105105100',   securityCode: '123'}
, {type: 'amex',          number: '341111111111111',    securityCode: '1234'}
];

var fakeBankAccounts = [
  {routingNumber: '021000021', accountNumber: '9900000000', notes: 'state will be pending'}
, {routingNumber: '321174851', accountNumber: '9900000001', notes: 'state will be pending'}
, {routingNumber: '021000021', accountNumber: '9900000002', notes: 'state will be paid/success'}
, {routingNumber: '321174851', accountNumber: '9900000003', notes: 'state will be paid/success'}
];

/**
 * Get a random amount of fakeOptions
 * @return {Array}    The fake options array
 */
fakeOptions.random = function( amount ){
  amount = amount || parseInt( Math.random() * fakeOptions.length ) + 1;

  var result = [];

  for ( var i = 0, option; i < amount; ++i ){
    option = JSON.parse( JSON.stringify( fakeOptions[
      parseInt( Math.random() * fakeOptions.length )
    ]));

    option.name += ' ' + (Math.random() * 1000).toString(36);
    option.id = utils.uuid();

    option.options.forEach( function( o ){
      o.id = utils.uuid();
    });

    result.push( option );
  }

  return result;
};

fakeCategories.random = function(){
  return fakeCategories[
    parseInt( Math.random() * fakeCategories.length )
  ];
};

fakePhoneNumber = function () {
  return ""+Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
}

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
  restaurants: function(values) {
    var query =  {
      type:'insert'
    , table: 'restaurants'
    , returning: ['*']
    , values: values
    };
    if (Math.random() < .3) query.values.minimum_order = faker.Helpers.randomNumber(501) * 100;
    return query;
  }
, contacts: function(restaurant_id) {
    var query = {
      type: 'insert'
    , table: 'contacts'
    , returning: ['*']
    , values: {
        restaurant_id: restaurant_id
      , sms_phones: [config.testPhoneSms || fakePhoneNumber()]
      , voice_phones: [config.testPhoneVoice || fakePhoneNumber()]
      , emails: [config.testEmail || faker.Internet.email()]
      , name: faker.Name.findName()
      }
    };
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
      , menus: utils.sample(['group', 'individual'], Math.round(Math.random()*1)+1)
      }
    }
  }
, items: function(restaurant_id, category_id) {
    var item = {
      type:'insert'
    , table: 'items'
    , values: {
        restaurant_id: restaurant_id
      , category_id: category_id
      , order: incrementer('items_order_'+restaurant_id+'_'+category_id, 1)
      , name: faker.Lorem.words().slice(0, parseInt( Math.random() * 4 ) + 1 ).join(' ')
      , description: faker.Lorem.sentence()
      , price: faker.Helpers.randomNumber(1000)
      , feeds_min: 3
      , feeds_max: 5
      , options_sets: JSON.stringify( fakeOptions.random() )
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
, restaurantDeliveryZips: function(restaurant_id, zip, fee) {
    return {
      type: 'insert'
    , table: 'restaurant_delivery_zips'
    , values: {
        restaurant_id: restaurant_id
      , zip: zip
      , fee: fee
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
, paymentMethods: function(type, uri, data) {
    return {
      type: 'insert'
    , table: 'payment_methods'
    , values: {
        type: type
      , uri: uri
      , data: JSON.stringify(data)
      }
    , returning: ['id']
    };
  }
, mealStyles: function(name) {
    return {
      type: 'insert'
    , table: 'meal_styles'
    , values: {
        name: name
      }
    };
  }
}

utils.async.series(
  {
    restaurants: function(cb) {
      console.log("populating restaurants");
      utils.async.times(10, function(n, callback){
        var tasks = {
          fake: function(cbWaterfall){
            console.log('\trestaurants-task-fake');
            var data = {
              name: faker.Company.companyName()
            , street: faker.Address.streetAddress()
            , city: faker.Address.city()
            , state: faker.Address.usState(true)
            , zip: faker.Address.zipCodeFormat(0)
            , price: faker.Helpers.randomNumber(5) + 1
            , cuisine: faker.Lorem.words(faker.Helpers.randomNumber(4))
            , is_hidden: false
            , websites: ['http://poop.com']
            };
            cbWaterfall(null, data);
          }
        , createBalancedBankAccount: function(fake, cbWaterfall){
            console.log('\trestaurants-task-create-balanced-bank-account');
            var fakeBankAccount = _.sample(fakeBankAccounts, 1)[0];
            utils.balanced.BankAccounts.create({
              name: fake.name
            , account_number: fakeBankAccount.accountNumber
            , routing_number: fakeBankAccount.routingNumber
            , type: 'checking'
            }, function(error, bankAccount){
              if (error) return cbWaterfall(error);
              return cbWaterfall(null, fake, bankAccount);
            });
          }
        , createPaymentMethod: function(fake, bankAccount, cbWaterfall){
            console.log('\trestaurants-task-create-payment-method');
            query(inserts.paymentMethods('bank', bankAccount.uri, bankAccount), function(error, result){
              return cbWaterfall(error, fake, bankAccount);
            });
          }
        , createBalancedCustomer: function(fake, bankAccount, cbWaterfall){
            console.log('\trestaurants-task-create-balanced-customer');
            utils.balanced.Customers.create({
              name: fake.name
            , bank_account_uri: bankAccount.uri
            }, function(error, customer){
              if (error) return cbWaterfall(error);
              fake.balanced_customer_uri = customer.uri;
              return cbWaterfall(null, fake);
            });
          }
        , createRestaurant: function(fake, cbWaterfall){
            console.log('\trestaurants-task-create-restaurant');
            query(inserts.restaurants(fake), cbWaterfall);
          }
        , createContact: function(restaurant, cbWaterfall){
            console.log('\trestaurants-task-create-contact');
            query(inserts.contacts(restaurant[0].id), cbWaterfall);
          }
        };
        utils.async.waterfall(
          [
            tasks.fake
          , tasks.createBalancedBankAccount
          , tasks.createPaymentMethod
          , tasks.createBalancedCustomer
          , tasks.createRestaurant
          , tasks.createContact
          ]
        , function(error, results) {
            callback(error);
          }
        );

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
            query(
              inserts.restaurantDeliveryZips(
                results[n].id
              , austinZipCodes[x]
              , delivery_fees[ x % delivery_fees.length ]
              )
            , callback2
            );
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
          // provide at least one day open
          var days = utils.first(utils.shuffle(utils.range(7)), faker.random.number(6)+1); 
          utils.async.each(days, function(day, callback2) {
            query(inserts.restaurantDeliveryTimes(restaurant.id, day), callback2);
          }, callback)
        }, cb);
      });
    }
  , users: function(cb) {
      console.log("populating users");

      var tasks = {
        encryptPassword: utils.partial(utils.encryptPassword, 'password')
      , fake: function(hash, salt, cbWaterfall){
          console.log('\tusers-task-fake');
          var data = {
            name: 'Goodybag Admin'
          , organization: 'Goodybag, Inc.'
          , email: config.testEmail
          , password: hash
          };
          cbWaterfall(null, data);
      }
      , createBalancedCreditCard: function(fake, cbWaterfall){
          console.log('\tusers-task-create-balanced-credit-card');
          var fakeCreditCard = _.sample(fakeCreditCards, 1)[0];
          utils.balanced.Cards.create({
            card_number: fakeCreditCard.number
          , expiration_year: 2025
          , expiration_month: 12
          , security_code: fakeCreditCard.securityCode
          }, function(error, creditCard){
            if (error) return cbWaterfall(error);
            return cbWaterfall(null, fake, creditCard);
          });
        }
      , createPaymentMethod: function(fake, creditCard, cbWaterfall){
          console.log('\tusers-task-create-payment-method');
          query(inserts.paymentMethods('card', creditCard.uri, creditCard), function(error, rows){
            return cbWaterfall(error, fake, creditCard, rows[0]);
          });
        }
      , createBalancedCustomer: function(fake, creditCard, paymentMethod, cbWaterfall){
          console.log('\tusers-task-create-balanced-customer');
          utils.balanced.Customers.create({
            name: fake.first_name + ' ' + fake.last_name
          , card_uri: creditCard.uri
          }, function(error, customer){
            if (error) return cbWaterfall(error);
            fake.balanced_customer_uri = customer.uri;
            return cbWaterfall(null, fake, paymentMethod);
          });
        }
      , createUser: function(fake, paymentMethod, cbWaterfall){
          console.log('\tusers-task-create-user');
          query({
            type: 'insert'
          , table: 'users'
          , values: fake
          , returning: ['id']
          }, function(error, rows){
            if(error) return cbWaterfall(error);
            cbWaterfall(null, rows[0], paymentMethod);
          });
        }
      , createUserGroup: function(user, paymentMethod, cbWaterfall) {
          console.log('\tusers-task-add-user-to-group');
          query({
            type: 'insert'
          , table: 'users_groups'
          , values: {user_id: user.id, group: 'admin'}
          }, function(error, result){
            if (error) return cbWaterfall(error);
            cbWaterfall(null, user, paymentMethod);
          });
        }
      , createUserPaymentMethod: function(user, paymentMethod, cbWaterfall) {
          console.log('\tusers-task-add-create-user-payment-method');
          query({
            type: 'insert'
          , table: 'users_payment_methods'
          , values: {
              user_id: user.id
            , payment_method_id: paymentMethod.id
            }
          }, function(error, result){
            if (error) return cbWaterfall(error);
            cbWaterfall(null, result);
          });
        }
      }
      utils.async.waterfall(
        [
          tasks.encryptPassword
        , tasks.fake
        , tasks.createBalancedCreditCard
        , tasks.createPaymentMethod
        , tasks.createBalancedCustomer
        , tasks.createUser
        , tasks.createUserGroup
        , tasks.createUserPaymentMethod
        ]
      , function(error, results){
          cb(error);
        }
      );
    }
  , mealStyles: function(cb) {
      utils.async.waterfall([
        function(next) {
          query(inserts.mealStyles('Group'), next);
        },

        function(arg, next) {
          query(inserts.mealStyles('Individual'), next);
        }
      ], cb);
    }
  }
, function(error, results) {
  if (error) console.error(error);
  process.exit(0);
  }
);

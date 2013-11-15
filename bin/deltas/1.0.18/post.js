#!/usr/bin/env node

var utils = require('../../../utils');
var models = require('../../../models');

var createBalancedCustomer = function (entity, callback) {
  utils.balanced.Customers.create({
    name: entity.attributes.name
  }, function (error, customer) {
    if (error) return callback(error);
    entity.attributes.balanced_customer_uri = customer.uri;
    entity.save(function(error) {
      return callback(error);
    });
  });
}

var done =function (error, results) {
  if (error) return console.log(error), console.log(error.stack), process.exit(1);
  process.exit(0);
}

var updateUsers = function (callback) {
  models.User.find(
    {
      where: {
        balanced_customer_uri: {$null: true}
      }
    , limit: 1000000
    }
  , function (error, users) {
    utils.async.mapLimit(users, 5, createBalancedCustomer, function (error, results) {
      return callback(error, results);
    });
  });
}

var updateRestaurants = function (callback) {
  models.Restaurant.find(
    {
      where: {
        balanced_customer_uri: {$null: true}
      }
    , limit: 1000000
    }
  , function (error, restaurants) {
    utils.async.mapLimit(restaurants, 5, createBalancedCustomer, function (error, results) {
      return callback(error, results);
    });
  });
}

utils.async.series([updateUsers, updateRestaurants], done);
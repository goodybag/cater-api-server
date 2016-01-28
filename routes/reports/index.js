var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');

var route = module.exports = express.Router();

/**
 * Reporting resource
 */

route.get('/', m.restrict(['admin']), m.getRegions(), controllers.reports.index);

route.get('/orders'
, m.timeout({ timeout: 1000*20 })
, m.restrict(['admin'])
, m.csv()
, controllers.reports.ordersCsv
);

route.get('/users', m.restrict(['admin']), m.csv(), controllers.reports.usersCsv);

route.get('/redemptions', m.restrict(['admin']), m.csv(), controllers.reports.usersRedemptionsCsv);

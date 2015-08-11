var express = require('express');

var m = require('../middleware');
var config = require('../config');
var controllers = require('../controllers');

var route = module.exports = express.Router();

route.get('/bazaarvoice', controllers.lunchroom.sendAppHtml());
var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');

var route = module.exports = express.Router();

route.use('/restaurants', require('./restaurants'));

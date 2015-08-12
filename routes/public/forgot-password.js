var express = require('express');
var controllers = require('../../controllers');

var route = module.exports = express.Router();

route.get('/', controllers.auth.forgotPassword);
route.post('/', controllers.auth.forgotPasswordCreate);
route.get('/:token', controllers.auth.forgotPasswordConsume);
route.post('/:token', controllers.auth.forgotPasswordConsume);

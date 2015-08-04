var express = require('express');
var compose = require('composable-middleware');

var controllers = require('../../controllers');
var db = require('../../db');
var venter = require('../../lib/venter');

var m = require('../../middleware');

var route = module.exports = express.Router();

var record = compose(m.analytics, m.queryParams());

route.get('/', record, m.getRegions({where: {is_hidden: false}}), controllers.auth.index);

route.get('/login', record, m.view('landing/login', {layout: 'layout/default'}));

route.post('/login', record, controllers.auth.login);

route.get('/join', record, m.getRegions({where: {is_hidden: false}}), controllers.auth.registerView);
route.post('/join', record, m.getRegions({where: {is_hidden: false}}), controllers.auth.register);

route.get('/rewards', record, m.view('landing/rewards', {
  layout: 'landing/layout'
}));

route.get('/testimonials',
        record,
        m.json({file: '/public/data/testimonials.json', target: 'testimonials'}),
        m.view('landing/testimonials', {layout: 'landing/layout'}));

route.get('/request-to-be-a-caterer',
        record,
        m.view('landing/restaurant', {layout: 'landing/layout'}));

route.post('/request-to-be-a-caterer',
         record,
         m.after(notifyRestaurantRequest),
         m.view('landing/restaurant', db.restaurant_requests, {layout: 'landing/layout', method: 'insert'}));

route.use('/forgot-password', record, require('./forgot-password')); // do this with the rest of these eventually

function notifyRestaurantRequest(req, res, next) {
  venter.emit('restaurant_request:created', req.body);
  next();
}

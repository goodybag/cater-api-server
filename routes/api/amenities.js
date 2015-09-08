var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');

var route = module.exports = express.Router();

/**
 * Amenities
 */

route.use(m.restrict('admin'));

route.post('/', m.insert(db.amenities));

route.get('/:id', m.param('id'), m.findOne(db.amenities));

route.put('/:id', m.param('id'), m.update(db.amenities));

route.patch('/:id', m.param('id'), m.update(db.amenities));

route.delete('/:id', m.param('id'), m.remove(db.amenities));

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

/**
 * @api {get} /amenities/:id   Returns the specified amenity.
 * @apiName GetAmenity
 * @apiGroup Amenities
 * @apiPermission admin

 * @apiSuccess   {Object}     amenity                   Returned amenity.
 * @apiSuccess   {Number}     amenity.id                Amenity id.
 * @apiSuccess   {String}     amenity.created_at        Timestamp when amenity was created.
 * @apiSuccess   {String}     amenity.name              Amenity name.
 * @apiSuccess   {String}     amenity.description       Amenity description.
 * @apiSuccess   {Number}     amenity.price             Amentiy price.
 * @apiSuccess   {Number}     amenity.restaurant_id     Amenity restaurant id.
 * @apiSuccess   {String}     amenity.scale             Amenity scale.
 * @apiSuccess   {Boolean}    amenity.enabled           "True" if amenity is enabled.
 **/
route.get('/:id', m.param('id'), m.findOne(db.amenities));

route.put('/:id', m.param('id'), m.update(db.amenities));

route.patch('/:id', m.param('id'), m.update(db.amenities));

route.delete('/:id', m.param('id'), m.remove(db.amenities));

/**
 * Restaurant Event Model
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');
  var moment = require('moment');

  return module.exports = Backbone.Model.extend({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          required: true
        },
        description: {
          type: ['string', 'null'],
          required: false
        },
        date_range: {
          type: 'string',
          required: true
        },
        closed: {
          type: 'boolean',
          required: true
        }
      }
    },

    /**
     * Convert Restaurant Event into a FullCalendar Event object
     */
    toFullCalendarEvent: function() {
      // Convert canonical daterange from postgres [start, end)
      var date_range = this.get('date_range');
      // really hacky, the date ranges are stored like
      // [2014-01-15,2014-01-18) in postgres with inclusive, exclusive bounds
      // probably should convert them to timestamp ranges ..
      date_range = date_range.replace( /[\[\]\(\)]/g,'').split(',');;
      return {
        title:  this.get('name'),
        start:  date_range[0],                          // lower bound inclusive
        end:    moment(date_range[1]).add('days', -1),  // upper bound should be exclusive
        id:     this.id
      };
    },

    validator: amanda('json'),

    validate: function(attrs, options) {
      return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
    },

    urlRoot: function() { 
      return '/restaurants/' + this.attributes.restaurant_id + '/events'
    }
  });
});
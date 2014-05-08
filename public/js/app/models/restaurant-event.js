/**
 * Restaurant Event Model
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');
  var moment = require('moment');
  var utils = require('utils');

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
        during: {
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
      var during = this.get('during');
      during = during.replace( /[\[\]\(\)]/g,'').split(',');

      return utils.extend({}, this.toJSON(), {
        title:  this.get('name')
      , start:  during[0]
      , end:    moment(during[1]).add('days', -1).format('YYYY-MM-DD') // convert to inclusive bound
      });
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

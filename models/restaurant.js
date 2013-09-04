var moment = require('moment-timezone');

var Model = require('./model');
var utils = require('../utils');

module.exports = Model.extend({
  getCategories: function(callback) {
    var self = this;
    callback = callback || function() {};
    require('./category').find(
      {where: {'restaurant_id': this.attributes.id},
       order: {order: 'asc'}},
      function(err, results) {
        if (err) return callback(err);
        self.categories = results;
        callback(null, results);
      });
  },

  getItems: function(callback) {
    var self = this;
    callback = callback || function() {};
    var items = function(err) {
      if (err) return callback(err);
      if (!self.categories || self.categories.length === 0)
        return callback(null, null);
      var categories = utils.map(self.categories, function(cat) { return cat.toJSON().id; });
      require('./item').find(
        {where: {'category_id': {$in: categories}},
         order: {order: 'asc'}},
        function(err, results) {
          if (err) return callback(err);
          self.items = results;

          var catIndex = utils.object(utils.map(self.categories, function(cat) {
            return cat.attributes.id;
          }), self.categories);

          utils.each(results, function(item) {
            var cat = catIndex[item.attributes.category_id];
            cat.items ? cat.items.push(item) : cat.items = [item];
          });

          callback(null, results);
        }
      );
    }

    self.categories ? items() : self.getCategories(items);
  },

  toJSON: function() {
    var obj = Model.prototype.toJSON.apply(this, arguments);
    if (this.categories) obj.categories = utils.invoke(this.categories, 'toJSON');
    return obj;
  }
},

{
  table: 'restaurants',

  findOne: function(query, orderParams, callback) {
    if (utils.isFunction(orderParams)) {
      callback = orderParams;
      orderParams = null;
    }

    if (!utils.isObject(query)) query = {where: {id: query}};
    query.limit = 1;
    return this.find(query, orderParams, function(err, models) {
      if (err) return callback(err);
      callback(null, models[0]);
    });
  },

  find: function(query, orderParams, callback) {
    if (utils.isFunction(orderParams)) {
      callback = orderParams;
      orderParams = null;
    }

    query = query || {};
    query.columns = query.columns || ['*'];
    query.order = query.order || ["restaurants.id"];
    query.joins = query.joins || {};
    query.distinct = true;

    var unacceptable = [];
    if (orderParams && orderParams.zip) {
      query.joins.zips = {
        type: 'left'
      , alias: 'zips'
      , target: 'restaurant_delivery_zips'
      , on: {
          'restaurants.id': '$zips.restaurant_id$'
        , 'zips.zip': orderParams.zip
        }
      }

      query.columns.push('(zips.zip IS NULL) AS is_bad_zip');
      unacceptable.push('(zips.zip IS NULL)');
    }

    if (orderParams && orderParams.guests) {
      query.joins.guests = {
        type: 'left'
      , alias: 'guests'
      , on: {'restaurants.id': '$guests.restaurant_id$'}
      , target: {
          type: 'select'
        , table: 'restaurant_lead_times'
        , distinct: true
        , columns: ['restaurant_id']
        , where: {
            'max_guests': {$gte: orderParams.guests}
          }
        }
      }

      query.columns.push('(guests.restaurant_id IS NULL) AS is_bad_guests');
      unacceptable.push('(guests.restaurant_id IS NULL)');
    }

    if (orderParams && (orderParams.date || orderParams.time)) {
      query.joins.delivery_times = {
        type: 'left'
      , alias: 'delivery_times'
      , target: 'restaurant_delivery_times'
      , on: {
          'restaurants.id': '$delivery_times.restaurant_id$'
        }
      }

      query.columns.push('(delivery_times.id IS NULL) AS is_bad_delivery_time');
      unacceptable.push('(delivery_times.id IS NULL)');
    }

    // TODO: only allow valid dates in order params, currently assumes so
    if (orderParams && orderParams.date) {
      // determine if lead time is unacceptable only if date is provided
      var datetime = moment(orderParams.date);
console.log(datetime)
      // TODO: only allow valid times in order params, currently assumes so
      if(orderParams.time) {
        var timeparts = orderParams.time.split(':');
        datetime.hour(timeparts[0]);
        datetime.minute(timeparts[1]);
        datetime.second(0);
      } else {
        datetime.hour(23);
        datetime.minute(59);
        datetime.second(59);
      }

      // mongo-sql can't do the following in a nice way yet:
      // hours: {$lte: "$EXTRACT(EPOCH FROM ('"+datetime.toISOString()+"' - now())/3600)$"}
      // current work around in mongo-sql is this, but not going to do that:
      // hours: {$custom: ['"hours" < EXTRACT(EPOCH FROM ($1 - now())/3600)', datetime.toISOString()]}
      // instead going to calculating it in code
      var hours = Math.floor(moment.duration(new moment(datetime) - new moment()).as('hours'));

      query.joins.lead_times = {
        type: 'left'
      , alias: 'lead_times'
      , on: {'restaurants.id': '$lead_times.restaurant_id$'}
      , target: {
          type: 'select'
        , table: 'restaurant_lead_times'
        , distinct: true
        , columns: ['restaurant_id']
        , where: {
            'max_guests': {$gte: ((orderParams.guests) ? orderParams.guests : 0)}
          , 'lead_time': {$lte: hours}
          }
        }
      }

      query.columns.push('(lead_times.restaurant_id IS NULL) AS is_bad_lead_time');
      unacceptable.push('(lead_times.restaurant_id IS NULL)');

      var day = moment(datetime).tz('America/Chicago').day();
console.log("DAY##################", moment(datetime).tz('America/Chicago').day())
      query.joins.delivery_times.on['delivery_times.day'] = day;
    }

    if (orderParams && orderParams.time) {
      query.joins.delivery_times.on['delivery_times.start_time'] = {$lte: orderParams.time};
      query.joins.delivery_times.on['delivery_times.end_time'] = {$gte: orderParams.time};
    }

    query.columns.push((unacceptable.length) ? '('+unacceptable.join(' OR ')+') as is_unacceptable' : '(false) as is_unacceptable');

    Model.find.call(this, query, callback);
  },
});

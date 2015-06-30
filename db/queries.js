var uuid  = require('node-uuid');
var utils = require('../utils');

var defaultSelect = function() {
  return {
    type: 'select',
    columns: ['*'],
    limit: '100',
    offset: '0'
  };
};

var find = function(table, columns, limit, offset) {
  return utils.defaults({
    table: table,
    columns: columns,
    limit: limit,
    offset: offset
  }, defaultSelect());
}

var findOne = function(table, where, columns) {
  var query = find(table, columns, 1, 0);
  query.where = utils.isObject(where) ? where : {id: where};
  return query;
}

var upsert = function(table, values, where) {
  var query = {
    type: where != null ? 'update' : 'insert',
    table: table,
    returning: ['*']
  };

  if (where != null) query.where = utils.isObject(where) ? where : {id: where};
  query[where != null ? 'updates' : 'values'] = values;

  return query;
}

var del = function(table, where) {
  if (!utils.isObject(where)) where = {id: where}
  return {
    type: 'delete',
    where: where,
    table: table
  }
}

// The point of models is to prevent this sort of thing
var userGroups = function(query) {
  query.columns.push({
    type: 'array_agg',
    as: 'groups',
    expression: '"users_groups"."group"'
  });

  if(!query.joins) query.joins = {};
  query.joins.users_groups = {
    type: 'left',
    on: {'user_id': '$users.id$'}
  };
  query.groupBy = 'id';

  return query;
}

var userRestaurants = function(query) {
  query.columns.push({
    type: 'array_agg',
    as: 'restaurant_ids',
    expression: '"users_restaurants"."restaurant_id"'
  });

  if(!query.joins) query.joins = {};
  query.joins.users_restaurants = {
    type: 'left',
    on: {'user_id': '$users.id$'}
  };
  query.groupBy = 'id';

  return query;
}

module.exports = {
  restaurant: {
    list: utils.partial(find, 'restaurants'),
    create: utils.partial(upsert, 'restaurants'),
    update: utils.partial(upsert, 'restaurants'),
    createZips: utils.partial(upsert, 'restaurant_delivery_zips'),
    createDeliveryTimes: utils.partial(upsert, 'restaurant_delivery_times'),
    createLeadTimes: utils.partial(upsert, 'restaurant_lead_times'),
    createHours: utils.partial(upsert, 'restaurant_hours'),
    createPickupLeadTimes: utils.partial(upsert, 'restaurant_pickup_lead_times'),
    createTags: utils.partial(upsert, 'restaurant_tags'),
    createMealTypes: utils.partial(upsert, 'restaurant_meal_types'),
    createMealStyles: utils.partial(upsert, 'restaurant_meal_styles'),
    createContacts: utils.partial(upsert, 'contacts'),
    delZips: function(rid) {
      return del.call(this, 'restaurant_delivery_zips', {restaurant_id: rid});
    },
    delDeliveryTimes: function(rid) {
      return del.call(this, 'restaurant_delivery_times', {restaurant_id: rid});
    },
    delLeadTimes: function(rid) {
      return del.call(this, 'restaurant_lead_times', {restaurant_id: rid});
    },
    delHours: function(rid) {
      return del.call(this, 'restaurant_hours', {restaurant_id: rid});
    },
    delPickupLeadTimes: function(rid) {
      return del.call(this, 'restaurant_pickup_lead_times', {restaurant_id: rid});
    },
    delTags: function(rid) {
      return del.call(this, 'restaurant_tags', {restaurant_id: rid});
    },
    delMealTypes: function(rid) {
      return del.call(this, 'restaurant_meal_types', {restaurant_id: rid});
    },
    delMealStyles: function(rid) {
      return del.call(this, 'restaurant_meal_styles', {restaurant_id: rid});
    }
  },

  category: {
    create: function(category, restaurantId) {
      category.restaurant_id = restaurantId;
      return upsert('categories', category);
    },
    update: utils.partial(upsert, 'categories'),
    del: utils.partial(del, 'categories')
  },

  item: {
    create: function(item, restaurantId, categoryId) {
      item.restaurant_id = restaurantId;
      item.category_id = categoryId;
      return upsert('items', item);
    },
    update: utils.partial(upsert, 'items'),
    del: utils.partial(del, 'items'),
    createTags: utils.partial(upsert, 'item_tags'),
    delTags: function(id) {
      return del.call(this, 'item_tags', {item_id: id});
    }
  },

  transaction: {
    createIfUriNotExists: function (type, orderId, data) {
      // must start with a character, not number for it to be valid dollar quoted string
      var rand = 'x'+Math.random().toString(36).substr(2, 5);
      var uri = data.balance_transaction;
      if (typeof data === 'object') data = JSON.stringify(data);
      return {
        type: 'insert'
      , table: 'transactions'
      , columns: ['type', 'order_id', 'uri', 'data']
      , expression: {
          type: 'select'
        , expression: [type, orderId, uri, data].map(function(i){return '$'+rand+'$$'+i+'$'+rand+'$$';})
        , where: {
            $notExists: {
              type: 'select'
            , expression: [1]
            , table: 'transactions'
            , columns: []
            , where: {
                uri: uri
              }
            }
          }
        }
      }
    }
  },

  user: {
    list: utils.compose(
      function(query) {
        query.order = {id: 'desc'};
        return query;
      },userGroups, userRestaurants, utils.partial(find, 'users')
    ),
    get: utils.compose(userGroups, userRestaurants, utils.partial(findOne, 'users')),
    create: utils.partial(upsert, 'users'),
    update: utils.partial(upsert, 'users'),
    del: utils.partial(del, 'users'),
    setGroup: utils.partial(upsert, 'users_groups')
  },

  userRestaurant: {
    list: utils.partial(find, 'users_restaurants'),
    get: utils.partial(findOne, 'users_restaurants'),
    create: utils.partial(upsert, 'users_restaurants'),
    update: utils.partial(upsert, 'users_restaurants')
  },

  orderItem: {
    update: utils.partial(upsert, 'order_items'),
    del: utils.partial(del, 'order_items')
  },

  passwordReset: {
    get: utils.compose(function(query) {
      query.columns.push('users.email');

      query.joins = {
        users: {
          type: 'inner',
          on: {id: '$user_id$'}
        }
      };

      return query;
    }, utils.partial(findOne, 'password_resets'), function(token) {
      return {token: token, token_used: {$null: true}};
    }),
    create: function(email) {
      var values = {
        token: uuid.v4(),
        user_id: {
          type: 'select',
          table: 'users',
          columns: ['id'],
          where: {
            $custom: [ 'lower(users.email) = lower($1)', email ]
          }
        }
      };

      return upsert.call(this, 'password_resets', values);
    },

    redeem: utils.compose(utils.partial(upsert, 'password_resets', {token_used: 'now()'}), function(token) {
      return {token: token};
    })
  },

  waitlist: {
    get: utils.compose(utils.partial(findOne, 'waitlist'), function(email) {
      return !utils.isObject(email) ? {email: email} : email;
    }),
    create: utils.compose(utils.partial(upsert, 'waitlist'), function(values) {
      return {
        unsubscribed: null,
        confirmed: null,
        created_at: 'now()',
        email: values.email,
        organization: values.organization,
        data: JSON.stringify(values),
        token: values.token || uuid.v4()
      };
    }),
    reAdd: function(where, data, token) {
      var values = {
        unsubscribed: null,
        confirmed: null,
        created_at: 'now()',
        organization: data.organization,
        data: JSON.stringify(data)
      };

      if (token) values.token = token;

      return upsert.call(this, 'waitlist', values, utils.isObject(where) ? where : {email: where});
    },
    confirm: function(token) {
      return upsert('waitlist', {confirmed: 'now()'}, {token: token});
    },
    unsubscribe: function(token) {
      return upsert('waitlist', {unsubscribed: 'now()'}, {token: token});
    }
  }

};

module.exports.orders = {};
module.exports.orders.acceptedButNot = function( ids ){
  var $query = { where: { status: 'accepted' } };
  if ( ids && ids.length ){
    if ( !$query.where.id ) $query.where.id = {};
    $query.where.id.$nin = ids;
  }
  return $query;
};

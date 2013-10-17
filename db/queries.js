var utils = require('../utils');
var uuid  = require('node-uuid');

var defaultSelect = {
  type: 'select',
  columns: ['*'],
  limit: '100',
  offset: '0'
}

var find = function(table, columns, limit, offset) {
  return utils.defaults({
    table: table,
    columns: columns,
    limit: limit,
    offset: offset
  }, defaultSelect);
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
    returning: '*'
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
  utils.extend(query, {
    joins: {
      users_groups: {
        type: 'left',
        on: {'user_id': '$users.id$'}
      }
    },
    groupBy:'id'
  });
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
    createTags: utils.partial(upsert, 'restaurant_tags'),
    delZips: function(rid) {
      return del.call(this, 'restaurant_delivery_zips', {restaurant_id: rid});
    },
    delDeliveryTimes: function(rid) {
      return del.call(this, 'restaurant_delivery_times', {restaurant_id: rid});
    },
    delLeadTimes: function(rid) {
      return del.call(this, 'restaurant_lead_times', {restaurant_id: rid});
    },
    delTags: function(rid) {
      return del.call(this, 'restaurant_tags', {restaurant_id: rid});
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
    del: utils.partial(del, 'items')
  },

  user: {
    list: utils.compose(userGroups, utils.partial(find, 'users')),
    get: utils.compose(userGroups, utils.partial(findOne, 'users')),
    create: utils.partial(upsert, 'users'),
    update: utils.partial(upsert, 'users'),
    del: utils.partial(del, 'users'),
    setGroup: utils.partial(upsert, 'users_groups')
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
          where: {email: email}
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

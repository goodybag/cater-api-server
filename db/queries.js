var utils = require('../utils');

var defaultSelect = {
  type: 'select',
  columns: '[*]',
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

var findOne = function(table, id, columns) {
  var query = find(table, columns, 1, 0);
  query.where = {id: id};
  return query;
}

var upsert = function(table, values, id) {
  var query = {
    type: id ? 'update' : 'insert',
    table: table,
    returning: '*'
  };

  if (id) query.where = {id: id};
  query[id ? 'updates' : 'values'] = values;

  return query;
}

var del = function(table, id) {
  return {
    type: 'delete',
    where: {id: id},
    table: table
  }
}

module.exports = {
  restaurant: {
    create: utils.partial(upsert, 'restaurants'),
    update: utils.partial(upsert, 'restaurants')
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
    create: function(item, categoryId) {
      item.category_id = categoryId;
      return upsert('items', item);
    },
    update: utils.partial(upsert, 'items'),
    del: utils.partial(del, 'items')
  },

  user: {
    list: utils.partial(find, 'users'),
    get: utils.partial(fineOne, 'users'),
    create: utils.partial(upcert, 'users'),
    update: utils.partial(upcert, 'users'),
    del: utils.partial(del, 'users')
  }
};

var utils = require('../utils');

var defaultSelect = {
  type: 'select',
  columns: '[*]',
  limit: '100',
  offset: '0'
}

var upcert = function(table, values) {
  return {
    type: values.id ? 'update' : 'insert',
    values: values,
    table, table
  };
}

var del = function(table, id) {
  return {
    type: 'delete',
    where: {id: id},
    table: table
  }
}

module.exports.addRestaurant = utils.partial(upcert, 'restaurants');

module.exports.updateRestaurant = utils.partial(upcert, 'restaurants');

module.exports.restaurantAddCategory = function(restaurantId, category) {
  category.restaurant_id = restaurantId;
  return upcert('categories', category);
};

module.exports.updateCategory = utils.partial(upcert, 'categories');

module.exports.removeCategory = utils.partial(del, 'categories');

module.exports.addItem = function(categoryId, item) {
  item.category_id = categoryId;
  return upcert('items', item);
}

module.exports.updateItem = utils.partial(upcert, 'items');

module.exports.removeItem = utils.partial(del, 'items');

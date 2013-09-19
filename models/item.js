var Model = require('./model');
var utils = require('../utils');

module.exports = Model.extend({}, {
  table: 'items',
  find: function(query, callback) {
    query.with = utils.extend({
      // TODO: array syntax for ordering
      options_agg: {
        type: 'select',
        table: 'options',
        columns: [
          'options_set_id',
          {
            type: 'array_agg',
            as: 'options',
            expression: '(\'{"name":"\' || name || \'", "price":\' || CASE WHEN price IS NULL THEN \'null\' ELSE price::text END || \', "default_state":\' || default_state || \'}\')::json'
          }
        ],
        groupBy: 'options_set_id'
      },

      options_sets_agg: {
        type: 'select',
        table: 'options_sets',
        joins: {
          options_agg: {
            type: 'left',
            on: { 'options_set_id': '$options_sets.id$' }
          }
        },
        columns: [
          'item_id',
          {
            type: 'array_agg',
            as: 'options',
            expression: '(\'{"name": \' || CASE WHEN name IS NULL THEN \'null\' ELSE \'"\' || name || \'"\' END  || \', "type": "\' || type || \'", "options": \' || array_to_json(options) || \'}\')::json'
          }
        ],
        groupBy: 'item_id'
      }
    }, query.with);

    query.columns = query.columns && query.columns.length ? query.columns : ['*'];

    query.joins = utils.extend({
      options_sets_agg: {
        type: 'left',
        on: { 'item_id': '$items.id$' }
      }
    }, query.joins);

    query.columns.push({
      type: 'array_to_json',
      as: 'options_sets',
      expression: 'options_sets_agg.options'
    });

    return Model.find.call(this, query, callback);
  }
});

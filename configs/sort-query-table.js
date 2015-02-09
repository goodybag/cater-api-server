// Map sort queries to order by clause
module.exports = {
  'popular':                'popularity DESC'
, 'name':                   'name ASC'
, 'price':                  'price ASC'
, 'price desc':             'price DESC'
, 'order minimum':          'minimum_order ASC NULLS FIRST'
, 'order minimum desc':     'minimum_order DESC NULLS LAST'
, 'delivery fee':           'delivery_fee ASC'
, 'delivery fee desc':      'delivery_fee DESC'
};

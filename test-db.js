var utils = require('./utils')
var db = require('./db');
var Models = require('./models');

var run =  function(){
  console.log('run');

  utils.async.parallel([
    Models.Order.findOne.bind( Models.Order, { where: { id: 2500 } } )
  , Models.Order.findOne.bind( Models.Order, { where: { id: 2501 } } )
  , Models.Order.findOne.bind( Models.Order, { where: { id: 2502 } } )
  , Models.Order.findOne.bind( Models.Order, { where: { id: 2503 } } )
  , Models.Order.findOne.bind( Models.Order, { where: { id: 2504 } } )
  , Models.Order.find.bind( Models.Order, { where: { }, limit: 20 } )
  ], function( e, r ){
    console.log('complete', e);
    setTimeout( run, 1000 )
  });
};


run();
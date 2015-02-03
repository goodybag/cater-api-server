var utils = require('../utils');

var modes = [
  'once', 'recurring'
];

module.exports = function( options ){
  var evaluator = module.exports.getEvaluator( options );

  return function( req, res, next ){
    evaluator( req.session, res.locals );
    return next();
  };
};

module.exports.getEvaluator = function( options ){
  options = utils.defaults( options || {}, {
    threshold:  5
  , mode:       'once'
  });

  if ( typeof options.name !== 'string' ){
    throw new Error('Invalid options.name');
  }

  if ( modes.indexOf( options.mode ) === -1 ){
    throw new Error('Invalid mode');
  }

  return function( session, results ){
    var uviews = session.userViews = session.userViews || {};

    uviews[ options.name ] = uviews[ options.name ] || {
      value: 0, wasPrompted: false
    };

    var val = ++uviews[ options.name ].value;

    if ( val > 0 && val % options.threshold === 0 && !uviews[ options.name ].wasPrompted ){
      results[ options.name ] = true;

      if ( options.mode === 'once' ){
        uviews[ options.name ].wasPrompted = true;
      }
    } else {
      results[ options.name ] = false;
    }
  }
};
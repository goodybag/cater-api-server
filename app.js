
/**
 * Module dependencies.
 */

var
  express = require('express')
, hbs = require('hbs')
, utils = require('./utils')
, routes = require('./routes')
;

var middleware = {
  cors: require('./middleware/cors')
, domains: require('./middleware/domains')
, uuid: require('./middleware/uuid')
};

// handle these bars
var blocks = {};
hbs.registerHelper('extend', function(name, context) {
  var block = blocks[name];
  if (!block) {
    block = blocks[name] = [];
  }

  block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
});

hbs.registerHelper('block', function(name) {
  var val = (blocks[name] || []).join('\n');

  // clear the block
  blocks[name] = [];
  return val;
});

hbs.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

hbs.registerHelper('dollars', function(pennies, options) {
  return (pennies / 100).toFixed(2);
});

hbs.registerHelper('tax', function(cents) {
  return (cents * 0.000825).toFixed(2);
});

hbs.registerHelper('total', function(cents) {
  return (cents * 0.010825).toFixed(2);
});

hbs.registerHelper('statusLabel', function(status) {
  if (!status) return 'label-default';
  return 'label-' + {
    canceled: 'danger',
    pending: 'info',
    submitted: 'warning',
    denied: 'danger',
    accepted: 'warning',
    delivered: 'success'
  }[status];
});

// TODO: make this a partial
hbs.registerHelper('address', function(loc) {
  if (!loc) return '';
  var line1 = loc.street ? loc.street : utils.joinIf([loc.street1, loc.street2], ', ');
  // TODO: put in <abbr> tag for state
  var line2 = utils.joinIf([utils.joinIf([utils.capitalize(loc.city), (loc.state && loc.state.toUpperCase())], ', '), loc.zip], ' ');
  return utils.joinIf([line1 ? '<span class="addr addr-street">' + line1 + '</span>' : null,
                       line2 ? '<span class="addr addr-city-state-zip">' + line2 + '</span>' : null], '\n');
});

var app = module.exports = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.compress());

  app.use(express.cookieParser('WOOT THE FUCK'));
  app.use(express.cookieSession());

  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(middleware.uuid());
  app.use(middleware.domains);
  app.use(middleware.cors);
  app.use(app.router);

  app.set('view engine', 'hbs');

  /**
   * Request & Response prototype updates
   */
  app.response.error = function(error, details, callback) {
    utils.sendError(this, error, details);
    if (callback) callback(error);
  };
  app.response.noContent = function() {
    this.status(204).send('{}');
  };
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

routes.register(app);

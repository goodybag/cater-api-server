var utils = require('./utils');
var states = require('./public/states');

module.exports.register = function(handlebars) {
  var blocks = {};
  handlebars.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if (!block) {
      block = blocks[name] = [];
    }

    block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
  });

  handlebars.registerHelper('block', function(name) {
    var val = (blocks[name] || []).join('\n');

    // clear the block
    blocks[name] = [];
    return val;
  });

  handlebars.registerHelper('dollars', function(pennies) {
    return (pennies / 100).toFixed(2);
  });

  handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });

  handlebars.registerHelper('or', function(value1, value2) {
    return value1 || value2;
  });

  handlebars.registerHelper('tax', function(cents) {
    return (cents * 0.000825).toFixed(2);
  });

  handlebars.registerHelper('total', function(cents) {
    return (cents * 0.010825).toFixed(2);
  });

  handlebars.registerHelper('statusLabel', function(status) {
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
  handlebars.registerHelper('address', function(loc) {
    if (!loc) return '';
    var line1 = loc.street ? loc.street : utils.joinIf([loc.street1, loc.street2], ', ');
    var state = loc.state ? utils.findWhere(states, {abbr: loc.state.toUpperCase()}) : null;
    var stateStr = state ? '<abbr title="' + state.name + '">' + state.abbr + '</abbr>' : '';
    var line2 = utils.joinIf([utils.joinIf([utils.capitalize(loc.city), stateStr], ', '), loc.zip], ' ');
    return utils.joinIf([line1 ? '<span class="addr addr-street">' + line1 + '</span>' : null,
                         line2 ? '<span class="addr addr-city-state-zip">' + line2 + '</span>' : null], '\n');
  });
}

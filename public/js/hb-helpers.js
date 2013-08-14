if (typeof require !== 'undefined') {
  var utils  = require('../../utils');
  var states = require('../states');
} else {
  utils = _;
  var states
  $.get('/states.json', null, function(data, textStatus, jqXHR) {
    states = data;
  }, 'json');
}

var joinIf = function(arr, sep) {
  return Array.prototype.join.call(utils.compact(arr), sep);
}

var capitalize = function(str) {
  if (!str) return '';
  return str[0].toUpperCase() + str.substring(1);
}


var blocks = {};

var helpers = {
  extend: function(name, context) {
    var block = blocks[name];
    if (!block) {
      block = blocks[name] = [];
    }

    block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
  },

  block: function(name) {
    var val = (blocks[name] || []).join('\n');

    // clear the block
    blocks[name] = [];
    return val;
  },

  dollars: function(pennies) {
    return (pennies / 100).toFixed(2);
  },

  json: function(context) {
    return JSON.stringify(context);
  },

  or: function(value1, value2) {
    return value1 || value2;
  },

  tax: function(cents, rate, options) {
    if (!cents) return '0.00';
    var mul = options ? rate / 100 : 0.000825;
    return (cents * mul).toFixed(2);
  },

  total: function(cents, rate, options) {
    if (!cents) return '0.00';
    var mul = options ? (1 + rate) / 100 : 0.010825;
    return (cents * mul).toFixed(2);
  },

  statusLabel: function(status) {
    if (!status) return 'label-default';
    return 'label-' + {
      canceled: 'danger',
      pending: 'info',
      submitted: 'warning',
      denied: 'danger',
      accepted: 'warning',
      delivered: 'success'
    }[status];
  },

  price$: function(price) {
    return new Array(price + 1).join('$');
  },

  // TODO: make this a partial
  address: function(loc) {
    if (!loc) return '';
    var line1 = loc.street ? loc.street : joinIf([loc.street1, loc.street2], ', ');
    var state = loc.state ? utils.findWhere(states, {abbr: loc.state.toUpperCase()}) : null;
    var stateStr = state ? '<abbr title="' + state.name + '">' + state.abbr + '</abbr>' : '';
    var line2 = joinIf([joinIf([capitalize(loc.city), stateStr], ', '), loc.zip], ' ');
    return joinIf([line1 ? '<span class="addr addr-street">' + line1 + '</span>' : null,
                         line2 ? '<span class="addr addr-city-state-zip">' + line2 + '</span>' : null], '\n');
  }
}

if (typeof module !== 'undefined') module.exports = helpers;

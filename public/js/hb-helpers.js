if (typeof require !== 'undefined') {
  var utils  = require('../../utils');
  var states = require('../states');
  var moment = require('moment');
} else {
  utils = _;
  var states
  $.ajax({
    url:'/states.json',
    success: function(data, textStatus, jqXHR) {
      states = data;
    },
    async: false
  });
}

var joinIf = function(arr, sep) {
  return Array.prototype.join.call(utils.compact(arr), sep);
}

var capitalize = function(str) {
  if (!str) return '';
  return str[0].toUpperCase() + str.substring(1);
}


// taken from here: http://stackoverflow.com/a/4467559
var mod = function(a, n) {
  return ((a % n) + n) % n;
}

var blocks = {};

var tax = function(subtotal, deliveryFee, rate, options) {
  var numArgs = arguments.length;
  if (numArgs === 0) return '0.00';
  if (numArgs < 4) {
    if (numArgs === 2) {
      options = deliveryFee;
      deliveryFee = 0
    } else {
      options = rate;
    }
    rate = 0.0825;
  }
  return ((parseInt(subtotal) + parseInt(deliveryFee)) * parseFloat(rate) / 100).toFixed(2);
}

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

  tax: tax,

  total: function(cents, deliveryFee, rate, options) {
    if (options === undefined) {
      options = rate;
      rate = null;
    }

    rate = rate ? rate + 1 : 1.0825;
    return tax.call(this, cents, deliveryFee, rate, options);
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

  datepart: function(date) {
    return date ? (new Date(date)).toDateString() : '';
  },

  timepart: function(date) {
    if (!date) return '';
    return moment(date).format('h:mm A');
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

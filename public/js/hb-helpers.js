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

var dateTimeFormatter = function(date, format) {
  if (!date) return '';
  return moment(date).format(format || 'YYYY-MM-DD');
}

var timeFormatter = function(time, format) {
  if (!time) return '';
  if(typeof time == "object") time = time.toString();

  var datetime = new moment();

  time = time.match(/(\d+)(?::(\d\d))?\s*(PM?|pm?|p?)/);
  datetime.hours( parseInt((time[1]) % 12) + (time[3] ? 12 : 0) );
  datetime.minutes( parseInt(time[2]) || 0 );
  datetime.seconds(0);
  return datetime.format(format || 'HH:mm');
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
    var cents = parseInt(pennies);
    return utils.isNaN(cents) ? '' : (cents / 100).toFixed(2);
  },

  json: function(context) {
    return JSON.stringify(context);
  },

  or: function(value1, value2) {
    return value1 || value2;
  },

  array: function(arr) {
    return arr ? arr.join(', ') : '';
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
    return date ? moment(date).format('l') : '';
  },

  timepart: function(date) {
    if (!date) return '';
    return moment(date).format('h:mm A');
  },

  formatDateTime: function(date, format, options) {
    if (options === undefined) {
      options = format;
      format = undefined;
    }
    return dateTimeFormatter(date, format || "MM/DD/YYYY");
  },

  formatTime: function(time, format, options) {
    if (options === undefined) {
      options = format;
      format = undefined;
    }
    return timeFormatter(time, format || "h:mm A");
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
  },

  phoneNumber: function(num, format, options) {
    if (options === undefined) {
      options = format;
      format = undefined;
    }
    if (!/\d{10}/.test(num)) return;
    var result = format || '(xxx) xxx-xxxx';
    var str = '' + num;
    for (var i in str)
      result = result.replace('x', str[i]);
    return result;
  },

  capitalize: function(str) {
    if(str && typeof str === 'string') {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    return str;
  },

  weekday: function(day) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
  },

  mailto: function(email) {
    return '<a href="mailto:' + email + '">' + email + '</a>';
  },

  eq: function(a, b, options){
    return options[a == b ? 'fn' : 'inverse'](this);
  },

  dneq: function(a, b, options){
    return options[a != b ? 'fn' : 'inverse'](this);
  },

  lt: function(a, b, options){
    return options[a < b ? 'fn' : 'inverse'](this);
  },

  lte: function(a, b, options){
    return options[a <= b ? 'fn' : 'inverse'](this);
  },

  gt: function(a, b, options){
    return options[a > b ? 'fn' : 'inverse'](this);
  },

  gte: function(a, b, options){
    return options[a >= b ? 'fn' : 'inverse'](this);
  },

  dollarMeter: function( value, max, additionalClass ){
    max = (/number|string/).test( typeof max ) ? max : 4;
    additionalClass = typeof additionalClass == "string" ? additionalClass : "";

    var tmpl = '<span class="dollar-meter-item{{more-class}}">$</span>';
    var out = [];

    for ( var i = 1; i <= max; i++ ){
      out.push( tmpl.replace( '{{more-class}}', (value >= i ? ' dollar-meter-item-filled' : '') + ' ' + additionalClass ) );
    }

    return out.join('\n');
  }
}

if (typeof module !== 'undefined') module.exports = helpers;

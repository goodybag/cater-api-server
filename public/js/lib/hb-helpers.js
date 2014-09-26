if (typeof module === 'object' && typeof define !== 'function') {
  var define = function(factory) {
    return module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var moment = require('moment');
  var utils = require('./utils');
  var states = require('./states');
  var config = require('config');

  var blocks = {};

  var tax = function( order ){
    if ( !order ) return 0;

    var val = order.sub_total + order.restaurant.delivery_fee;

    return Math.round( val * order.restaurant.sales_tax );
  };

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
      var cents = pennies == null ? 0 : parseFloat(pennies); // parse as float incase of partial cents
      return utils.isNaN(cents) ? '' : utils.Math.round10(cents / 100, -2).toFixed(2); // partial cents get rounded here
    },

    dollarsOmit00: function(pennies) {
      var cents = pennies == null ? 0 : parseFloat(pennies); // parse as float incase of partial cents
      var dollars = utils.isNaN(cents) ? '' : utils.Math.round10(cents / 100, -2).toFixed(2); // partial cents get rounded here

      if ( dollars.slice(-2) === '00' ){
        return dollars.substring( 0, dollars.indexOf('.') );
      }

      return dollars;
    },

    pennies: function(dollars) {
      var val = Math.round( dollars * 100 );
      return utils.isNaN(val) ? '' : val;
    },

    dollarsNoCents: function(pennies){
      var cents = pennies == null ? 0 : parseFloat(pennies); // parse as float incase of partial cents
      return utils.isNaN(cents) ? '' : (cents / 100)
    },

    json: function(context, key) {
      if ( typeof key === 'string' ){
        key = key.split('.');
        for ( var i = 0, l = key.length; i <l; i++ ){
          context = context[ key[i] ];
        }
      }
      return JSON.stringify(context);
    },

    or: function(value1, value2) {
      return value1 || value2;
    },

    and: function(value1, value2) {
      return value1 && value2;
    },

    not: function( val ){
      return !val;
    },

    array: function(arr) {
      return arr ? arr.join(', ') : '';
    },

    list: function( list ){
      return [
        '<ul>'
      , '  <li>' + (utils.isArray( list ) ? list.join('</li>\n  <li>') : list) + '</li>'
      , '</ul>'
      ].join('\n');
    },

    tax: function() {
      return (tax.apply(this, arguments) / 100).toFixed(2);
    },

    total: function(order, options) {
      if (typeof order !== 'object') {
        throw new Error('Must supply a valid `order` as first parameter')
      }

      order.tip = order.tip || 0;

      var total = order.sub_total + order.restaurant.delivery_fee;
      total += tax( order );

      return ((total + order.tip) / 100).toFixed(2);
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

    calendar: function(date) {
      return date ? moment(date).calendar() : '';
    },

    formatDateTime: function(date, format, options) {
      if (options === undefined) {
        options = format;
        format = undefined;
      }
      return utils.dateTimeFormatter(date, format || "MM/DD/YYYY");
    },

    formatTime: function(time, format, options) {
      if (options === undefined) {
        options = format;
        format = undefined;
      }
      return utils.timeFormatter(time, format || "h:mm A");
    },

    unixTimestamp: function(datetime) {
      if(!datetime) return '';
      return moment(datetime).unix();
    },

    // TODO: make this a partial
    address: function(loc) {
      if (!loc) return '';
      var line1 = loc.street ? loc.street : utils.joinIf([loc.street1, loc.street2], ', ');
      var state = loc.state ? utils.findWhere(states, {abbr: loc.state.toUpperCase()}) : null;
      var stateStr = state ? '<abbr title="' + state.name + '">' + state.abbr + '</abbr>' : '';
      var line2 = utils.joinIf([utils.joinIf([utils.capitalize(loc.city), stateStr], ', '), loc.zip], ' ');
      return utils.joinIf([line1 ? '<span class="addr addr-street">' + line1 + '</span> ' : null,
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

    sanitizePhoneNumber: function(str) {
      return str.replace(/\D/g, '');
    },

    floor: function(value) {
      return Math.floor(value);
    },

    divide: function(dividend, divisor) {
      return dividend / divisor;
    },

    intDivide: function(dividend, divisor) {
      return Math.floor( dividend / divisor );
    },

    mod: function(dividend, divisor) {
      return dividend % divisor;
    },

    leadtime: function(minutes) {
      var hours = Math.floor(minutes / 60);
      var minutes = minutes % 60;
      return hours + ' hrs' + (minutes ? ' ' + minutes + ' mins' : '');
    },

    /**
     * Convert array of 10 digit numbers
     * to string of formatted phone numbers
     * separated by comma.
     */
    phoneList: function(list) {
      return utils.map(list, utils.compose(helpers.phoneNumber, utils.identity)).join(', ');
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

    shortWeekday: function(day) {
      return (helpers.weekday(day) || '').substring(0, 3);
    },

    mailto: function(email) {
      return '<a href="mailto:' + email + '">' + email + '</a>';
    },

    // Append http protocol if missing
    website: function(url) {
      return (/^https?:\/\//).test(url) ? url : 'http://' + url;
    },

    eq: function(a, b, options){
      if ( typeof options.fn !== 'function' ) return a == b;
      return options[a == b ? 'fn' : 'inverse'](this);
    },

    dneq: function(a, b, options){
      if ( typeof options.fn !== 'function' ) return a != b;
      return options[a != b ? 'fn' : 'inverse'](this);
    },

    lt: function(a, b, options){
      if ( typeof options.fn !== 'function' ) return a < b;
      return options[a < b ? 'fn' : 'inverse'](this);
    },

    lte: function(a, b, options){
      if ( typeof options.fn !== 'function' ) return a <= b;
      return options[a <= b ? 'fn' : 'inverse'](this);
    },

    gt: function(a, b, options){
      if ( typeof options.fn !== 'function' ) return a > b;
      return options[a > b ? 'fn' : 'inverse'](this);
    },

    gte: function(a, b, options){
      if ( typeof options.fn !== 'function' ) return a >= b;
      return options[a >= b ? 'fn' : 'inverse'](this);
    },

    datePassed: function(datetime, options) {
      return options[ moment(datetime) < moment() ? 'fn' : 'inverse'](this);
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
    },

    dump: function( val ){
      return [ '<pre>', JSON.stringify( val, true, '  ' ), '</pre>' ].join('\n');
    },

    lowercase: function( val ){
      return val.toLowerCase();
    },

    capitalze: function( val ){
      return val[ 0 ].toUpperCase() + val.substring( 1 );
    },

    // return url hash friendly strings
    anchorify: function( str ){
      return str.toLowerCase().replace(/\s+/g, '-').replace(/[^0-9a-zA-Z-]/g, '');
    },

    withNullable: function(context, options) {
      if (utils.isFunction(context)) { context = context.call(this); }

      return options.fn(context != null ? context : [])
    },

    ifAllDay: function(times, options) {
      if (!times || times.length != 2 || !times[0] || !times[1])
        return options.inverse(this);

      var ref = [[0, 0, 0], [23, 59, 59]];
      var ints = utils.map(times, function(time) { return utils.map(time.split(':'), function(part) { return parseInt(part); }); });
      return options[utils.isEqual(ref, ints) ? 'fn' : 'inverse'](this);
    },

    log: function( val ){
      console.log( val );
    },

    range: function(start, end) {
      return start != end ? [start, '-', end].join('') : start;
    },

    range2: function( start, end, options ){
      var out = "";
      for ( var i = start; i <= end; i++ ){
        out += options.fn( i );
      }
      return out;
    },

    reverseRange: function( start, end, options ){
      var out = "";
      for ( var i = start; i >= end; i-- ){
        out += options.fn( i );
      }
      return out;
    },

    pad: function( n, width, z ){
      width = ['number', 'string'].indexOf( typeof width ) === -1 ? 1 : width;
      z = ['number', 'string'].indexOf( typeof z ) === -1 ? '0' : z;
      n = n + '';
      return n.length >= width ? n : new Array( width - n.length + 1 ).join(z) + n;
    },

    queryParams: function( obj ){
      var params = obj || {};
      var rest = Array.prototype.slice.call( arguments, 1 );

      // If next args are url-encodable, then they're using rest-syntax
      if ( [ 'string', 'number' ].indexOf( typeof rest[1] ) > -1 ){
        params = utils.clone( obj );

        for ( var i = 0, l = rest.length; i < l - 1; i += 2 ){
          params[ rest[i] ] = rest[ i + 1 ];
        }
      }

      return utils.queryParams( params );
    },

    notEmpty: function( obj, options ){
      return options[ !utils.isEmpty( obj ) ? 'fn' : 'inverse' ]();
    },

    uuid: function(){
      return utils.uuid();
    },

    filepicker: function(url, width, height){
      if (!url) return "";

      url = url.replace('www', 'cdn');

      var params = {};

      if (url.indexOf('convert') == -1){
        url += "/convert";
        params.cache = true;
        params.fit = 'crop';
      }

      if (typeof width === 'number') params.w = width;
      if (typeof height === 'number') params.h = height;

      return url + utils.queryParams(params);
    },

    substr: function(str, from, to){
      if ( typeof str !== 'string' ) return "";
      return str.substring( from, to );
    },

    truncate: function(str, length) {
      return str.length > length ? str.substring(0, length) + '...' : str;
    },

    typeOf: function(a){
      return typeof a;
    },

    isEven: function( n, options ){
      return options[ n % 2 === 0 ? 'fn' : 'inverse' ]();
    },

    isOdd: function( n, options ){
      return options[ n % 2 !== 0 ? 'fn' : 'inverse' ]();
    },

    or2: function(){
      var args = Array.prototype.slice.call( arguments );
      var options = args.pop();

      // If any of the values are truthy, run `fn`, otherwise `inverse`
      return options[ utils.any( args, utils.identity ) ? 'fn' : 'inverse' ](this);
    },

    ratingStars: function( rating ){
      var tmplReg = /\{\{type\}\}/g;
      var out = [];
      var tmpl = '<i class="rating-star gb-icon-star{{type}}"></i>';

      for ( var i = 1; i <= 5; i++ ){
        if ( !rating ){
          out.push( tmpl.replace( tmplReg, '-empty' ) );
        } else if ( i <= rating || ( (i - 0.5) > rating && (i - 0.5) <= rating) ){
          out.push( tmpl.replace( tmplReg, '' ) );
        } else if ( (i - 0.75) <= rating ){
          out.push( tmpl.replace( tmplReg, '-half-empty' ) );
        } else {
          out.push( tmpl.replace( tmplReg, '-empty' ) );
        }
      }

      return out.join('\n');
    },

    // http://stackoverflow.com/questions/9411538/handlebars-is-it-possible-to-access-parent-context-in-a-partial
    include: function(options) {
      var context = {},
      mergeContext = function(obj) {
        for(var k in obj)context[k]=obj[k];
      };
      mergeContext(this);
      mergeContext(options.hash);
      return options.fn(context);
    },

    contains: function(arr, element, options){
      if(utils.contains(arr, element)){
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },

    factorToPercent: function( factor, precision, options ){
      if ( typeof precision === 'object' || !precision ){
        precision = 2;
      }

      return parseFloat( ( factor * 100 ).toFixed( precision ) );
    },

    percentToFactor: function( percent, precision, options ){
      if ( typeof precision === 'object' || !precision ){
        precision = 2;
      }

      return parseFloat( ( percent / 100 ).toFixed( precision ) );
    },

    add: function (value, addition) {
      return (+value) + (+addition);
    },

    commatize: function( x, options ){
      if ( !x && x != 0 ) return;

      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    },

    giftcardClasses: function( card, user ){
      var classList = [];

      if ( card.amount >= 5000 ){
        classList.push('giftcard-gold');
      } else if ( card.amount >= 2000 ){
        classList.push('giftcard-orange');
      }

      if ( card.cost > user.points ){
        classList.push('state-unavailable');
      }

      return classList.join(' ');
    },

    cdn: function(){
      // Just in case they pass in their own slash
      for ( var key in arguments ){
        if ( arguments[ key ][0] === '/' ){
          arguments[ key ] = arguments[ key ].toString().substring(1);
        }
      }

      return [ config.isDev ? [] : config.cdn.baseUrl ].concat(
        Array.prototype.slice.call( arguments, 0, - 1 )
      ).join('/');
    },

    join: function( set, joiner, prop ){
      if ( typeof prop === 'string' ){
        set = utils.pluck( set, prop );
      }

      return utils.isArray( set ) ? set.join( joiner || ', ' ) : set;
    },

    uncamelize: function( text ){
      var result = text.replace( /([A-Z])/g, " $1" );
      return result.charAt(0).toUpperCase() + result.slice(1);
    },

    format: function( str, obj ){
      return utils.template( str )( obj );
    },

    ref: function( obj, key ){
      return obj[ key ];
    },

    isNull: function( val, options ){
      return options[ val === null ? 'fn' : 'inverse' ]();
    },

    notNull: function( val, options ){
      return options[ val !== null ? 'fn' : 'inverse' ]();
    },

    orderTypeAbbr: function( order ){
      switch( order.type ){
        case 'pickup': return 'P';
        case 'courier': return 'DS';
        case 'delivery': return 'D';
        default: return 'D';
      }
    },

    omit: function( obj, key ){
      return utils.omit( obj, key );
    },

    // Is a === any of rest
    is: function( a ){
      var rest = Array.prototype.slice.call( arguments, 1 );
      var options = rest.pop();

      // If any of the values are truthy, run `fn`, otherwise `inverse`
      return options[
        utils.any( rest, function( b ){ return a == b; })
          ? 'fn' : 'inverse'
      ](this);
    }
  }

  return module.exports = helpers;

});

define(function(require, exports, module) {
  var moment = require('moment');
  require('moment-timezone');

  var tz = require('json!/components/moment-timezone/moment-timezone.json');
  moment.tz.add(tz);

  return module.exports = moment;
});
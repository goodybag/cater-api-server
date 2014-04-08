var utils = require('./utils');
var moment = require('moment');

for (var i =0; i < 14; i++) {
  var now = moment(new Date()).hour(i);
  console.log('now = ' + now.toString());
  console.log('converted = ' + utils.saneDatetime(now));
}
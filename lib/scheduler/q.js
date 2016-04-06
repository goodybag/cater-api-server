var utils = require('../../utils');
var config = require('../../config');
var work = require('./work');

module.exports = utils.async.queue(work, config.scheduler.limit);

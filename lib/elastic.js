var config = require('../config');
var ElasticClient = require('elasticness');

module.exports = new ElasticClient(config.bonsai);
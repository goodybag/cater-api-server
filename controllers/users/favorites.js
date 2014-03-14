var db = require('../../db')
  , queries = require('../../db/queries')
  , errors = require('../../errors')
  , utils = require('../../utils')
  , config = require('../../config')
  , states = require('../../public/js/lib/states')
  , models = require('../../models');

var favorites = {
  list: function(req, res) {
    res.send('list');
  },

  add: function(req, res) {
    res.send('add');
  },

  remove: function(req, res) {
    res.send('remove');
  }
}

module.exports = favorites;

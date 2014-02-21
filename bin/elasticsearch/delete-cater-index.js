var request = require('request');
var config = require('../../config');
var elastic = require('../../lib/elastic');

elastic.removeSelf(function(error, result) {
  if (error) return console.log('Could\'nt remove index', error);
  console.log('Removed ' + elastic.index + ' index');
});
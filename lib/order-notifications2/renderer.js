/**
 * This module handles default template compilation
 */
var Handlebars = require('handlebars');

module.exports.render = function(template, context) {
  template = Handlebars.compile(template);
  return template(context);
};

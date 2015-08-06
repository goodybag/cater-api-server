define(function(require, exports, module) {
  //var request = require('superagent');
  var $ = require('jquery');

  /**
  * Sends a post request to a Backbone models url
  * This mixin method makes a few assumtions
  *  1. the component has a method .getFields() (return a list of field names)
  *  2. the component has a prop model and it's  a Backbone model
  *  3. all inputs have a ref
  * Note: this mixin shouldn't be used outside the context of
  * restaurant signup page.
  */
  module.exports.submitForm = function (callback) {

    var fields = this.getFields();
    var data = {};

    for (var k in this.refs) {
      if (fields.indexOf(k) < 0) continue;
      if (!this.refs[k].isValid()) return this.refs[k].displayError();
      data[k] = this.refs[k].val();
    }

    this.props.model.set(data);
    console.log('data ', data);
    return callback(null); // <-- remove later
    return $.ajax({
      type: 'POST'
    , url: this.props.model.url
    , data: { step: this.getStep(), data: this.props.model.toJSON() }
    , sucess: function (data) {
        callback(null, data);
      }
    , error: callback
    })
  };
});
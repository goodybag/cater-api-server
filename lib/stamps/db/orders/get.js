var stampit = require('stampit');

module.exports = stampit().methods({
  get: function() {
    this.reset();
    this.transforms.forEach(function (fn) { fn.call(this); }.bind(this));
    return {
      $query: this.$query
    , $options: this.$options
    };
  }
});

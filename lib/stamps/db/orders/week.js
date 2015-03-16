var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function week() {
    var enable = this.getWeek;
    if ( enable) {
      this.$options.columns = this.$options.columns || ['*'];
      this.$options.columns.push({ expression: 'extract(week from submitted) as week' });
    }
  });
});

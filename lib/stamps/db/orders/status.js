var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function queryByStatus() {
    if ( this.status ) {
      this.$query.status = this.status;
    }
  });
});

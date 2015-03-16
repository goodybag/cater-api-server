var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function joinUser() {
    // Default opt-in
    if ( this.user === false ) return;

    this.$options.one = this.$options.one || [];
    this.$options.one.push({ table: 'users', alias: 'user' });
  });
});

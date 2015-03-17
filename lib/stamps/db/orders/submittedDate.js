var stampit = require('stampit');

// Proxy option to attach latest submitted date
module.exports = stampit().enclose(function() {
  this.transforms.push(function joinSubmittedDate() {
    this.$options.submittedDate = this.submittedDate;
  });
});

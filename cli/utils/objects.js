var config = require('../config');
var commands = config.commands;

module.exports = {
  // returns all keys on an 'obj'
  getKeys: function(obj) {
    return Object.keys(obj);
  },

  // returns 'true' if the object is empty
  // 'false' if not
  isEmpty: function(obj) {
    if (this.getKeys(obj).length > 0) {
      return false;
    }

    return true;
  }

}

module.exports = {
  concat: function(strArr) {
    var concatString = '';
    strArr.forEach(function(str) {
      concatString += str;
    });
    return concatString;
  },

  contains: function(str, substr) {
    return str.indexOf(substr) !== -1;
  }
};

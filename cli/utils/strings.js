module.exports = {
  concat: function(strArr) {
    var concatString = '';
    strArr.forEach(function(str) {
      concatString += str;
    });
    return concatString;
  }
};

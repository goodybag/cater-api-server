module.exports = {
  // remove 'item' from 'arr', if found
  // otherwise, return original 'arr'
  removeItem: function(arr, item) {
    var indexOf = arr.indexOf(item);
    if(indexOf > -1) {
      arr.splice(indexOf, 1);
    }
    return arr;
  },

  // returns 'true' if 'item' is found in 'arr',
  // 'false' if otherwise
  itemExists: function(arr, item) {
    var found = false;
    var indexOf = arr.indexOf(item);
    if(indexOf > -1) {
      found = true;
    }
    return found;
  },

  // return a 'arr' consolidating the values of a specified 'key' in a nested 'obj'
  fromKeyinNest: function(obj, key) {
    var keys = Object.keys(obj);
    var arr = [];

    keys.forEach(function(objKey) {
      arr.push(obj[objKey][key]);
    });

    return arr;
  },

  // return a 'newArr', which combines all the values from the list of 'arrs'
  combine: function(arrs) {
    var newArr = [];
    arrs.forEach(function(arr) {
      arr.forEach(function(val) {
        newArr.push(val);
      })
    });
    return newArr;
  }
}

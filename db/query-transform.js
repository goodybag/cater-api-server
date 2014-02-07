module.exports = {
  /**
   * Strip off modifiers like ASC, DESC, NULLS FIRST, NULLS LAST 
   * off columns
   * 
   * @param {array|string} columns - A list or string of column names 
   * @returns {array} List of columns without modifiers
   */
  stripColumn: function(columns) {
    if(typeof columns ==='string') columns = [columns];
    return columns.map(function(column) { 
      return column.trim().split(' ')[0];
    });
  }
};

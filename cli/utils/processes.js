var arrUtil = require('./arrays');
var processes = require('../local-config.json').processes;

module.exports = {
  // returns an array of process names from local config
  getProcesses: function() {
    return Object.keys(processes);
  },

  // returns an array of ports from local config
  getPorts: function() {
    var procNames = this.getProcesses();
    var ports = [];

    procNames.forEach(function(procName) {
      ports.push(processes[procName]["port"]);
    });

    return ports;
  },

  // returns the 'port' of a given 'procName', if it exists
  // returns 'null' if it doesn't
  getPortOf: function(procName) {
    var procNames = this.getProcesses();
    if(arrUtil.itemExists(procNames, procName)) {
      return processes[procName]["port"];
    }
    return null;
  }
}

var actions = require('./actions');
var logger = require('./logger');

/**
 * Attach work function to action
 * @param {string}   action
 * @param {function} fn(job, done)
 */

module.exports = function registerAction(action, fn) {
  if ( actions[action] ){
    return logger.error( 'Already registered action: ' + action );
  }
  actions[action] = fn;
};

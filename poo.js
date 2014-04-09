var scheduler = require('./scheduler');

scheduler.queue('test', {what:8, lol:'yes'}, function() {

console.log(arguments);
});

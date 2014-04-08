var scheduler = require('./scheduler');

scheduler.schedule('test', {what:8, lol:'yes'}, function() {

console.log(arguments);
});

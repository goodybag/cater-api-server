var utils   = require('../../utils');
var Models  = require('../../models');
var assert = require('assert');

describe ('models.User', function(){
  it('isRestaurant at all', function() {
    var user = new Models.User();
    assert(!user.isRestaurant());
    user = new Models.User({ groups: ['restaurant'] });
    assert(user.isRestaurant());
  });

  it('isRestaurant for non restaurant owner', function() {
    var user = new Models.User();
    assert(!user.isRestaurant(34));
  });

  it('isRestaurant for restaurant owner', function() {
    var user = new Models.User();
    user.attributes.groups = ['restaurant'];
    user.attributes.restaurant_ids = [1,2,3];
    assert(user.isRestaurant(2));
  });

  it('isAdmin for admin user', function() {
    var user = new Models.User();
    user.attributes.groups = ['client', 'admin'];
    assert(user.isAdmin());
  });

  it('isAdmin for client user', function() {
    var user = new Models.User();
    user.attributes.groups = ['client'];
    assert(!user.isAdmin());
  });
});

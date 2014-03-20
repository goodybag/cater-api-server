/**
 * Functional Test: Accept-order
 *
 * Restaurant reviews order and accepts or denies it
 */

var config = require('../../functional-config');

var order = {
  id: 851
, review_token: 'cb1a0eeb-ca72-442a-927d-fb492ab0d977'
}

var url = [
  config.baseUrl
, 'orders'
, order.id + '?review_token=' + order.review_token
].join('/');

casper.test.begin( 'Accept Order', 3, function( test ){
  casper.echo('Viewing ' + url);

  casper.start( url );

  // Review receipt page
  casper.then( function() {
    test.assertExists('.page-order');
    test.assertExists('.btn-accept');
  });

  // TODO: figure better way to detect async loading is complete
  casper.then( function() {
    casper.wait(5000, function() {
      this.click('.btn-accept');
    });
  })

  // Accepted!
  casper.waitForSelector('.label-accepted', function() {
    test.assertExists('.label-accepted');
  });

  casper.run( test.done.bind( test ) );
});

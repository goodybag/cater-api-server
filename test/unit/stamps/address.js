var assert      = require('assert');
var config      = require('../../../config');
var addresses   = require('stamps/addresses');

describe('Stamps', function(){
  describe('Addresses', function(){
    describe('Base', function(){
      it('.toString()', function(){
        var address = addresses({
          street: '5336 Kreuger Ln.'
        , city: 'Austin'
        , state: 'TX'
        , zip: 78723
        });

        assert.equal(
          address.toString()
        , '5336 Kreuger Ln., Austin, TX, 78723'
        );
      });

      it('.toString()', function(){
        var address = addresses({
          street: '123 Sesame St.'
        , street2: 'Trashcan 456'
        , city: 'Austin'
        , state: 'TX'
        , zip: 78723
        });

        assert.equal(
          address.toString()
        , '123 Sesame St., Trashcan 456, Austin, TX, 78723'
        );
      });
    });
  });
});
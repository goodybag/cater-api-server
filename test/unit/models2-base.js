var assert      = require('assert');
var config      = require('../../config');
var Base        = require('../../public/js/app/models2/base');

// describe.only('Models2', function(){
//   describe('Base', function(){
//     it ('.create', function(){
//       var data = { a: 1, b: 2 };
//       var model = Base.create( data );

//       for ( var key in model ){
//         assert.equal( model[ key ], data[ key ] );
//       }
//     });

//     it('.method', function(){
//       var Extended = function(){
//         return Base.apply( this, arguments );
//       };

//       Extended.prototype = new Base();

//       Extended.prototype.method( 'test', function(){
//         return this.a;
//       });

//       var model = new Extended({ a: 7 });

//       assert.equal( model.test(), 7 );
//     });
//   });
// });
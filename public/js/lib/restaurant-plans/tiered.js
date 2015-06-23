/**
 * Tiered Plan
 *
 * {
 *   tiers: [
 *     { amount: 50000, fee: 0.12 }
 *   , { amount: 100000, fee: 0.13 }
 *   , { amount: 200000, fee: 0.14 }
 *   ...
 *   ]
 * }
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  return Object.create({
    getTier: function( plan, amount ){
      if ( !plan ) return { fee: 0 };
      var i;
      for ( i = 0; i < plan.data.tiers.length - 1; i++ ){
        if ( amount < plan.data.tiers[ i ].amount ) break;
      }

      return plan.data.tiers[ i ];
    }

  , getApplicationCut: function( plan, amount ){
      return Math.round( amount * this.getTier( plan, amount ).fee );
    }
  });
});

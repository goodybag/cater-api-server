define(function( require ){
  var utils             = require('utils');
  var MatrixEditor      = require('app/views/admin/matrix-editor');
  var DeliveryServices  = require('app/collections/delivery-services');
  var spinner           = require('spinner');

  var page = {
    init: function( options ){
      utils.enforceRequired( options, [
        'delivery_service'
      ]);

      page.options = options;

      page.delivery_services = new DeliveryServices();
      page.delivery_service = page.delivery_services.createModel( options.delivery_service );

      utils.domready(function(){
        var set = utils.chain( page.delivery_service.attributes.zips ).pluck('from').concat(
          utils.pluck( page.delivery_service.attributes.zips, 'to' )
        ).unique().value();

        page.$allZips = utils.dom('#all_zips');
        page.$allZips.change( page.onAllZipsChange );

        page.editor = new MatrixEditor({
          set:      set
        , dataIn:   "dollars"
        , dataOut:  "pennies"
        , legend:   [{ axis: 'x', label: 'To' }, { axis: 'y', label: 'From' }]
        });

        // Set the correct values on the editor
        page.delivery_service.attributes.zips.forEach( function( zip ){
          page.editor.values[ zip.from ][ zip.to ] = zip.price;
        });

        page.editor.setElement( utils.dom('.matrix-editor') );
        page.editor.render();

        page.updateAllZips( set );
      });

      utils.dom('.btn-save').click( page.onSaveBtnClick )
    }

  , updateAllZips: function( set ){
      page.$allZips.val( set.join(' ') );
    }

  , onAllZipsChange: function( e ){
      page.editor.setSet( page.$allZips.val().match(/(\d{5})/g) );
      page.editor.render();
    }

  , onSaveBtnClick: function( e ){
      spinner.start();

      var zips = [], x, y;

      for ( x in page.editor.values ){
        for ( y in page.editor.values[ x ] ){
          if ( page.editor.values[ x ][ y ] !== null ){
            zips.push({ from: +x, to: +y, price: page.editor.values[ x ][ y ] });
          }
        }
      }

      page.delivery_service.save({ zips: zips }).done( function(){

      }).error( function(){

      }).always( function(){
        spinner.stop();
      });
    }
  };

  return page;
});
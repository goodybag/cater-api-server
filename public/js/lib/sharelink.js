/**
*  Share Link Widget
*  - "Order with Goodybag" button
*/

(function (window, document) {

  // apply inline styles to element
  var applyStyle = function (el, styles) {
    for (var k in styles) {
      el['style'][k] = styles[k];
    }
  };

  var embeddedOrderIcon = function() {
    var orderBtns = document.querySelectorAll('.goodybag-order-button');

    var container = document.createElement('div');
    var button = document.createElement('button');
    applyStyle(button, {
      background: '#ed4242'
    , color: '#ffffff'
    , borderTopColor: '#ed4242'
    , boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    , position: 'relative'
    , display: 'inline-block'
    , border: 'none'
    , borderStyle: 'solid'
    , borderWidth: '1px'
    , borderBottomWidth: '2px'
    , borderRadius: '4px'
    , borderColor: '#dd1515'
    , padding: '5.5px 18px 4.5px 18px'
    , fontSize: '14px'
    , fontFamily: '"Avenir", Helvetica, sans-serif'
    , lineHeight: '0'
    , textDecoration: 'none'
    , letterSpacing: '0.4px'
    , verticalAlign: 'bottom'
    });

    var image = document.createElement('img');
    image.src = 'https://www.filepicker.io/api/file/2teJMBOMRgmdLfGdl8zO';
    applyStyle(image, {
      width: '30px'
    , height: '30px'
    , border: 'none'
    });

    var span = document.createElement('span');
    span.appendChild(document.createTextNode('Order with Goodybag'));
    applyStyle(span, {
      position: 'relative'
    , bottom: '10px'
    , left: '5px'
    });

    button.appendChild(image);
    button.appendChild(span);
    container.appendChild(button);
    for (var i=0; i < orderBtns.length; i++) {
      orderBtns[i].innerHTML = container.innerHTML;
    }
  };

  var DOMReady = function(a,b,c){
    b=document,
    c='addEventListener';
    b[c] ? b[c] ('DOMContentLoaded',a) : window.attachEvent('onload',a)
  };

  DOMReady(function () {
    embeddedOrderIcon();
  });

})(window, document);

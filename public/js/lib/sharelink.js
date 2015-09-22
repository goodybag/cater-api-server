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

    if (orderBtns.length < 1) return;

    var button = document.createElement('button');
    var link = document.createElement('a');

    link.title = 'order with goodybag!';
    link.href = 'https://www.goodybag.com/restaurants/' + orderBtns[0].getAttribute('data-rid');

    applyStyle(button, {
      background: '#ed4242'
    , color: '#ffffff'
    , borderTopColor: '#ed4242'
    , boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    , position: 'fixed'
    , bottom: '0'
    , left: '20px'
    , display: 'inline-block'
    , border: 'none'
    , borderStyle: 'solid'
    , borderWidth: '1px'
    , borderBottomWidth: '0'
    , borderRadius: '4px'
    , borderBottomLeftRadius: 0
    , borderBottomRightRadius: 0
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
    link.appendChild(button)

    orderBtns[0].parentNode.insertBefore(link, orderBtns[0]);
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

/**
 * config.invoice
 */

var env = process.env.GB_ENV;

if ( ['dev', 'staging', 'production'].indexOf( env ) === -1 ){
  env = 'dev';
}

module.exports = {
  pdf: {}
, fileFormat: 'invoice-:id.pdf'
, htmlRoute: '/invoices/:id'

, get pdfRoute (){
    return '/invoices/' + this.fileFormat;
  }

, bucket: ({
    production: 'invoices-prod.goodybag.com'
  , staging:    'invoices-staging.goodybag.com'
  , dev:        'invoices-dev.goodybag.com'
  })[ env ]
};
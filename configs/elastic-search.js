module.exports = {
  host: 'localhost:9200'
};

if ( process.NODE_ENV !== 'development' ){
  module.exports.host = process.env.BONSAI_URL;
}
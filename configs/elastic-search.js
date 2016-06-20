module.exports = function( local ){
  var config = {
    host: 'localhost:9200'
  , enabled: !!local.elasticSearchEnabled
  };

  if ( process.env.NODE_ENV !== 'development' ){
    config.host = process.env.BONSAI_URL;
    config.enabled = !!config.host;
  }

  return config;
};

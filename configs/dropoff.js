module.exports = {
  privateKey: '740e66a9e5f0c18f5439e72497801b659b77820a69a3900ed16aff4adc68a52f'
, publicKey:  'user::87cb7e7863c4e7c04026ff2b066462bc89d8d27cc41b443791d652dbab3d7727'
, apiUrl:     'https://qa-brawndo.dropoff.com/v1'
, host:       'qa-brawndo.dropoff.com'
};

if ( process.env.GB_ENV !== 'production' ){
  module.exports = {
    privateKey: '7b25b2587f4b2aaa94be72d6108506df47489fc49c6bebb6a8335f7bbfe3831f'
  , publicKey:  'user::6657a44ba8126646d999b930f3827d22835dbe9d6a64c3fa72713f813a105cd2'
  , apiUrl:     'https://brawndo.dropoff.com/v1'
  , host:       'brawndo.dropoff.com'
  };
}
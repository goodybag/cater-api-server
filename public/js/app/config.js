define(function(require){
  var config = {
    errorTypeMessages: {
      required:       '{noun} is required'
    , pattern:        'Please enter a valid {noun}'
    , password2:      'You must enter your password twice'
    , passwordMatch:  'Passwords do not match'
    }
  };

  return config;
});
/**
 * Errors
 *
 * Please refer to https://github.com/goodybag/magic/wiki/Error-Convention for spec
 */

var errors = {};

module.exports = errors;

/**
 * Internal Errors
 */

errors.internal = {};

errors.internal.DB_FAILURE = {
  type: "internal"
, code: "0001"
, httpCode: "500"
, name: "DB_FAILURE"
, message: "A query error has occurred"
};
errors[errors.internal.DB_FAILURE.code] = errors.internal.DB_FAILURE;

errors.internal.BAD_DATA = {
  type: "internal"
, code: "0002"
, httpCode: "500"
, name: "BAD_DATA"
, message: "Internal application data is not formed as expected"
};
errors[errors.internal.BAD_DATA.code] = errors.internal.BAD_DATA;

errors.internal.UNKNOWN = {
  type: "internal"
, code: "0003"
, httpCode: "500"
, name: "UNKNOWN"
, message: "Unexpected error"
};
errors[errors.internal.UNKNOWN.code] = errors.internal.UNKNOWN;

errors.internal.NOT_FOUND = {
  type: "internal"
, code: "0004"
, httpCode: "404"
, name: "NOT_FOUND"
, message: "Could not find that record"
};
errors[errors.internal.NOT_FOUND.code] = errors.internal.NOT_FOUND;

errors.internal.TIMEOUT = {
  type: "internal"
, code: "0005"
, httpCode: "503"
, name: "TIMEOUT"
, message: "The request timed out"
};
errors[errors.internal.TIMEOUT.code] = errors.internal.TIMEOUT;

/**
 * Authentication Errors
 */

errors.auth = {};

errors.auth.NOT_AUTHENTICATED = {
  type:     "auth"
, code:     "0101"
, httpCode: "401"
, name:     "NOT_AUTHENTICATED"
, message:  "You are not authenticated. Please Login."
};
errors[errors.auth.NOT_AUTHENTICATED.code] = errors.auth.NOT_AUTHENTICATED;

errors.auth.NOT_ALLOWED = {
  type:     "auth"
, code:     "0102"
, httpCode: "403"
, name:     "NOT_ALLOWED"
, message:  "You are not allowed to use this resource."
};
errors[errors.auth.NOT_ALLOWED.code] = errors.auth.NOT_ALLOWED;

errors.auth.INVALID_EMAIL = {
  type:     "auth"
, code:     "0103"
, httpCode: "401"
, name:     "INVALID_EMAIL"
, message:  "Invalid Email. Please try again."
};
errors[errors.auth.INVALID_EMAIL.code] = errors.auth.INVALID_EMAIL;

errors.auth.INVALID_PASSWORD = {
  type:     "auth"
, code:     "0104"
, httpCode: "401"
, name:     "INVALID_PASSWORD"
, message:  "Invalid Password. Please try again."
};
errors[errors.auth.INVALID_PASSWORD.code] = errors.auth.INVALID_PASSWORD;

errors.auth.DECRYPTION_FAILURE = {
  type:     "auth"
, code:     "0104"
, httpCode: "401"
, name:     "DECRYPTION_FAILURE"
, message:  "Unable to successfully decrypt password. Please try again."
};
errors[errors.auth.DECRYPTION_FAILURE.code] = errors.auth.DECRYPTION_FAILURE;

/**
 * Registration Errors
 */

errors.registration = {};

errors.registration.EMAIL_TAKEN = {
  type:     "registration"
, code:     "0201"
, httpCode: "400"
, name:     "EMAIL_TAKEN"
, message:  "This email has already been registered."
};
errors[errors.registration.EMAIL_TAKEN.code] = errors.registration.EMAIL_TAKEN;

/**
 * Input Errors
 */

errors.input = {};

errors.input.VALIDATION_FAILED = {
  type: "input"
, code: "0301"
, httpCode: "400"
, name: "VALIDATION_FAILED"
, message: "One or more of the supplied values did not pass validation"
};

errors[errors.input.VALIDATION_FAILED.code] = errors.input.VALIDATION_FAILED;

errors.input.INVALID_ADDRESS = {
  type: "input"
, code: "0302"
, httpCode: "400"
, name: "INVALID_ADDRESS"
, message: "The address provided is invalid"
};

errors[errors.input.INVALID_ADDRESS.code] = errors.input.INVALID_ADDRESS;

errors.input.INVALID_RESTAURANT = {
  type: "input"
, code: "0302"
, httpCode: "400"
, name: "INVALID_RESTAURANT"
, message: "The restaurant provided is invalid"
};

errors[errors.input.INVALID_RESTAURANT.code] = errors.input.INVALID_RESTAURANT;

/**
 * Stripe Errors
 */

errors.stripe = {};

errors.stripe.ERROR_ADDING_CARD = {
  type: "input"
, code: "0401"
, httpCode: "401"
, name: "ERROR_ADDING_CARD"
, message: "There was an error adding this card to your account"
};

errors[errors.stripe.ERROR_ADDING_CARD.code] = errors.stripe.ERROR_ADDING_CARD;

/**
 * Yelp Errors
 */

errors.restaurants = {};

errors.restaurants.INVALID_YELP_BUSINESS_ID = {
  type: "input"
, code: "0501"
, httpCode: "400"
, name: "INVALID_YELP_BUSINESS_ID"
, message: "The Yelp Business ID on this restaurant is invalid"
};

errors[errors.restaurants.INVALID_YELP_BUSINESS_ID.code] = errors.restaurants.INVALID_YELP_BUSINESS_ID;

/**
 * Google
 */

errors.google = {};

errors.google.distanceMatrix = {};
errors.google.distanceMatrix.INVALID_REQUEST = {
  type: 'input'
, code: '0601'
, httpCode: '400'
, name: 'INVALID_REQUEST'
, message: 'The provided request was invalid'
};

errors.google.distanceMatrix.MAX_ELEMENTS_EXCEEDED = {
  type: 'input'
, code: '0602'
, httpCode: '509'
, name: 'MAX_ELEMENTS_EXCEEDED'
, message: 'Product of origins and destinations exceeds the per-query limit'
};

errors.google.distanceMatrix.OVER_QUERY_LIMIT = {
  type: 'input'
, code: '0603'
, httpCode: '509'
, name: 'OVER_QUERY_LIMIT'
, message: 'The service has received too many requests from your application within the allowed time period'
};

errors.google.distanceMatrix.REQUEST_DENIED = {
  type: 'input'
, code: '0604'
, httpCode: '403'
, name: 'REQUEST_DENIED'
, message: 'The service denied use of the Distance Matrix service by your application'
};

errors.google.distanceMatrix.REQUEST_DENIED = {
  type: 'input'
, code: '0605'
, httpCode: '403'
, name: 'UNKNOWN_ERROR'
, message: 'Request could not be processed due to a server error. The request may succeed if you try again.'
};

errors.google.distanceMatrix.NOT_FOUND = {
  type: 'input'
, code: '0606'
, httpCode: '403'
, name: 'UNKNOWN_ERROR'
, message: 'The origin and/or destination of this pairing could not be geocoded'
};

errors.google.distanceMatrix.ZERO_RESULTS = {
  type: 'input'
, code: '0607'
, httpCode: '403'
, name: 'UNKNOWN_ERROR'
, message: 'No route could be found between the origin and destination'
};

/**
 * Runtime Errors
 */

errors.runtime = {};

errors.runtime.ERROR = {
  type: 'runtime'
, code: '0701'
, httpCode: '500'
, name: 'RUNTIME_ERROR'
, message: 'The application has encountered a run time error'
}

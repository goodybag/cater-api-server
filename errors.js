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
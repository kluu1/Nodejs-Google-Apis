const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = validateGeocodingBatch = (data) => {
  const errors = {};

  // Checks if data is undefined or null,
  // If undefined or null, set data to ''
  data.addresses = !isEmpty(data.addresses) ? data.addresses : '';

  // Checks if addresses is empty
  if (Validator.isEmpty(data.addresses)) {
    errors.addresses = 'Addresses field is required';
  }

  function isIterable(obj) {
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
  }

  if (!isIterable(data.addresses)) {
    error.addresses = 'Must pass in an iterable!';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = validateGeocoding = data => {
  let errors = {};

  // Checks if data is undefined or null,
  // If undefined or null, set data to ''
  data.address = !isEmpty(data.address) ? data.address : '';

  // Checks if address is empty
  if (Validator.isEmpty(data.address)) {
    errors.address = 'address field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

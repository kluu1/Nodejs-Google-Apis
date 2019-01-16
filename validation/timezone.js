const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = validateTimezone = data => {
  let errors = {};

  // Checks if data is undefined or null,
  // If undefined or null, set data to ''
  data.location = !isEmpty(data.location) ? data.location : '';
  data.timestamp = !isEmpty(data.timestamp) ? data.timestamp : '';

  // Checks if location is empty
  if (Validator.isEmpty(data.location)) {
    errors.location = 'location field is required';
  }

  // Checks if timestamp is empty
  if (Validator.isEmpty(data.timestamp)) {
    errors.timestamp = 'timestamp field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

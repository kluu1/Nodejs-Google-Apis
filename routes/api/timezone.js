require('dotenv').config();
const express = require('express');
const router = express.Router();
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Load User model
const User = require('../../models/Users');

// Load validation
const validateTimezone = require('../../validation/timezone');

// Create Limiter - 15 requests per hour
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: 'Too many requests from this IP, please try again after an hour'
});

// @route   POST api/timezone/
// @desc    Make timezone requests
// @access  Public
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  createAccountLimiter,
  (req, res) => {
    const { errors, isValid } = validateTimezone(req.body);
    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    // Decode jwt to get email address
    const token = req.headers.authorization.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SECRET_OR_KEY);
    const email = decoded.email;

    // Use email to get users credits
    User.findOne({ email }).then(user => {
      const credits = user.credits;
    });

    // Format timezone url
    const apikey = process.env.API_KEY;
    const location = req.body.location;
    const timestamp = req.body.timestamp;
    const timezone_url = `https://maps.googleapis.com/maps/api/timezone/json?location=${location}&timestamp=${timestamp}&key=${apikey}`;

    // POST request to timezone api
    axios
      .post(timezone_url)
      .then(function(response) {
        res.status(200).json({
          data: response.data
        });
      })
      .catch(function(err) {
        res.json({
          err
        });
      });
  }
);

module.exports = router;

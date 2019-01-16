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
const validategeocoding = require('../../validation/geocoding');

// Create Limiter - 15 requests per hour
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: 'Too many requests from this IP, please try again after an hour'
});

// @route   POST api/geocoding/
// @desc    Make geocoding requests
// @access  Public
router.post('/', passport.authenticate('jwt', { session: false }), createAccountLimiter, (req, res) => {
  const { errors, isValid } = validateGeocoding(req.body);
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

    // Check if user has enough credits
    if (credits === 0) {
      res.json({ credits: 'Not enough credits' });
    } else {
      // Format geocoding url
      const apikey = process.env.API_KEY;
      const address = req.body.address.replace(/\s/g, '+');
      const geocoding_url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apikey}`;

      // POST request to geocoding api
      axios
        .post(geocoding_url)
        .then(function(response) {
          res.status(200).json({
            data: response.data
          });
        })
        .then(function() {
          const newCredits = credits - 1;
          User.findOneAndUpdate({ email }, { credits: newCredits }).catch(function(err) {
            res.json({
              err
            });
          });
        });
    }
  });
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Promise = require('bluebird');
const users = require('../../controllers/usersController');

const router = express.Router();

// Load validation
const validateGeocoding = require('../../validation/geocoding');
const validateGeocodingBatch = require('../../validation/geocodingbatch');

// Create Limiter - 15 requests per hour
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: 'Too many requests from this IP, please try again after an hour',
});

// @route   POST api/geocoding/batch
// @desc    Send batch requests and only run 5 concurrently
// @access  Private
router.post('/batch', (req, res) => {
  const { errors, isValid } = validateGeocodingBatch(req.body);
  // Check if req params are valid
  if (!isValid) {
    // Return any errors with 400 status
    return res.status(400).json(errors);
  }

  const { addresses } = req.body;

  // Async function for calling the Geocoding API
  const callGeocoding = async geocodingURL => axios.post(geocodingURL);

  // Create empty array to store responses
  const data = [];

  // Using Bluebird Promise.map
  Promise.map(
    addresses,
    async (addressParam) => {
      // Build the geocoding URL
      const apikey = process.env.API_KEY;
      const address = addressParam.replace(/\s/g, '+');
      const geocodingURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apikey}`;
      // Store response in results and push to the data array
      const results = await callGeocoding(geocodingURL);
      data.push(results.data);
    },
    { concurrency: 5 },
  ).then(() => {
    res.json({ data });
  }).catch((err) => {
    res.json({ error: err });
  });
});

// @route   POST api/geocoding/
// @desc    Make geocoding requests
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  createAccountLimiter,
  async (req, res) => {
    const { errors, isValid } = validateGeocoding(req.body);
    // Check if req params are valid
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    // Decode JWT to get the username
    const token = req.headers.authorization.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SECRET_OR_KEY);
    const { username } = decoded;

    // Get user credits
    const { credits } = await users.getUserInfo(username);

    // Check if user has enough credits
    if (credits === 0) {
      res.json({ credits: 'Not enough credits' });
    } else {
      // Build the geocoding URL
      const apikey = process.env.API_KEY;
      const address = req.body.address.replace(/\s/g, '+');
      const geocodingURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apikey}`;

      // Make GET request to Geocoding API
      axios.get(geocodingURL).then((response) => {
        res.send(response.data);
      }).then(() => {
        // Subtract 1 from user credits
        const newCredits = credits - 1;
        const setCredits = async () => {
          try {
            return await users.setCredits(username, newCredits);
          } catch (error) {
            return error;
          }
        };
        setCredits();
      }).catch((err) => {
        res.json({ error: err.message });
      });
    }
  },
);

module.exports = router;

require('dotenv').config();
const express = require('express');
const router = express.Router();
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const users = require('../../controllers/usersController');

// Load validation
const validateTimezone = require('../../validation/timezone');

// Create Limiter - 15 requests per hour
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: 'Too many requests from this IP, please try again after an hour',
});

// @route   POST api/timezone/
// @desc    Make timezone requests
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  createAccountLimiter,
  async (req, res) => {
    const { errors, isValid } = validateTimezone(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    // Decode jwt to get username address
    const token = req.headers.authorization.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SECRET_OR_KEY);
    const { username } = decoded;

    // Get user credits
    const { credits } = await users.getUserInfo(username);

    // Check if user has enough credits
    if (credits <= 2) {
      res.json({ credits: 'Not enough credits' });
    } else {
      // Format timezone url
      const apikey = process.env.API_KEY;
      const { location, timestamp } = req.body;
      const timezoneURL = `https://maps.googleapis.com/maps/api/timezone/json?location=${location}&timestamp=${timestamp}&key=${apikey}`;

      // Make GET request to Geocoding API
      axios.get(timezoneURL).then((response) => {
        res.send(response.data);
      }).then(() => {
        // Subtract 2 from user credits
        const newCredits = credits - 2;
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

require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Promise = require('bluebird');

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Load User model
const User = require('../../models/Users');

/* TODO: DEBUG why axios response is not getting pushed into array
router.post('/batch', (req, res) => {
  // Store incoming addresses into array
  let addresses = req.body.addresses;
  let result = [];

  // Using Promise.map:
  Promise.map(
    addresses,
    function(address) {
      // Promise.map awaits for returned promises as well.
      const apikey = process.env.API_KEY;
      address = address.replace(/\s/g, '+');
      const geocoding_url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apikey}`;
      return callGeocoding(geocoding_url);
    },
    { concurrency: 5 }
  ).then(function() {
    console.log(result);
  });
});

function callGeocoding(geocoding_url) {
  // POST request to geocoding api
  axios
    .post(geocoding_url)
    .then(response => {
      result.push(response.data);
      console.log(result);
    })
    .then(
      function() {
        console.log('done');
      },
      { concurrency: 5 }
    );
}
*/

// @route   GET api/users/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  const { username, name, password, plan } = req.body;

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Check if user with username already exists
  User.findOne({ username })
    .then(user => {
      if (user) {
        errors.username = 'Username already exists';
        return res.status(400).json(errors);
      } else {
        let credits = 0;

        // Set credits based on plan chosen
        switch (req.body.plan) {
          case 'basic':
            credits = 10;
            break;
          case 'plus':
            credits = 20;
            break;
          case 'premium':
            credits = 30;
            break;
          default:
            errors.plan = 'Must be basic, plus, or premium';
        }

        // Create new user data
        const newUser = new User({
          username,
          name,
          username,
          password,
          plan,
          credits: credits
        });

        // Encrypt data before storing in DB
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
              throw err;
            }
            newUser.password = hash;
            newUser
              .save()
              .then(user => res.json(user))
              .catch(err => res.json({ error: err.message }));
          });
        });
      }
    })
    .catch(err => res.json({ error: err.message }));
});

// @route   GET api/users/login
// @desc    Login user / Returning JWT Token
// @access  Public
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  const { username, password } = req.body;

  // Check if any errors
  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Find user by username
  User.findOne({ username }).then(user => {
    // Check for user
    if (!user) {
      errors.username = 'User not found';
      return res.status(404).json(errors);
    }
    // Verify password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email
        };
        // Sign token and return to user
        jwt.sign(payload, process.env.SECRET_OR_KEY, { expiresIn: 3600 }, (err, token) => {
          res.json({
            success: true,
            token: `Bearer ${token}`
          });
        });
      } else {
        errors.password = 'Password incorrect';
        return res.status(400).json(errors);
      }
    });
  });
});

module.exports = router;

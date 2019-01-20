const config = require('config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const users = require('../../controllers/usersController');

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// @route   GET api/users/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  const {
    username, name, email, password, plan,
  } = req.body;

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Get user info
  const userData = await users.getUserInfo(username);

  if (userData) {
    res.json({ error: 'User already exists ' });
  } else {
    // If not, create new user and insert into database

    let credits = 0;
    // Set credits based on plan chosen
    switch (plan) {
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
        credits = 0;
    }

    // Encrypt data before storing in DB
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          throw err;
        }
        // Create new user object
        const newUser = {
          TableName: config.aws_table_name,
          Item: {
            username,
            name,
            email,
            password: hash,
            plan,
            credits,
          },
        };

        // Create new user and return response
        const createNewUser = await users.createUser(newUser);
        res.json({ success: true, data: 'Added new user' });
      });
    });
  }
});

// @route   GET api/users/login
// @desc    Login user / Returning JWT Token
// @access  Public
router.post('/login', async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  const { username, password } = req.body;

  // Check if any errors
  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Get user info
  const userData = await users.getUserInfo(username);

  // Return error if user is not found
  if (!userData) {
    errors.username = 'Username not found';
    return res.status(404).json(errors);
  }

  // If user is found, compare password
  const { password: hashPassword, email } = userData;

  // Verify password
  bcrypt.compare(password, hashPassword).then((isMatch) => {
    if (isMatch) {
      // Create JWT Payload
      const payload = {
        username,
        email,
      };
      // Sign token and return to user
      jwt.sign(payload, process.env.SECRET_OR_KEY, { expiresIn: 3600 }, (err, token) => {
        res.json({
          success: true,
          token: `Bearer ${token}`,
        });
      });
    } else {
      errors.password = 'Password incorrect';
      return res.status(400).json(errors);
    }
  });
});

module.exports = router;

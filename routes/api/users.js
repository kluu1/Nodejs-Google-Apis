const config = require('config');
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// @route   GET api/users/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  const {
    username, name, email, password, plan,
  } = req.body;

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Check if user already exists
  const docClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: config.aws_table_name,
    KeyConditionExpression: 'username = :i',
    ExpressionAttributeValues: {
      ':i': username,
    },
  };
  docClient.query(params, (err, user) => {
    if (err) {
      res.status(500).json({ Error: err.message });
    }

    // If user exists, return error
    if (user.Count > 0) {
      errors.username = 'Username already exists';
      return res.status(400).json(errors);
    }
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
      bcrypt.hash(password, salt, (err, hash) => {
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
        // Insert new user into the database
        docClient.put(newUser, (err, data) => {
          if (err) {
            res.send({
              success: false,
              message: `Error: ${err.stack}`,
            });
          } else {
            res.json({
              success: true,
              data: 'Added new user',
            });
          }
        });
      });
    });
  });
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
  AWS.config.update(config.aws_remote_config);
  const docClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: config.aws_table_name,
    KeyConditionExpression: 'username = :i',
    ExpressionAttributeValues: {
      ':i': username,
    },
  };
  docClient.query(params, (err, user) => {
    if (err) {
      res.status(500).json({ Error: err.message });
    }

    // If user is not found, return error
    if (user.Count === 0) {
      errors.username = 'Username not found';
      return res.status(404).json(errors);
    }
    // If found, compare password
    const { password: hashPassword, username, email } = user.Items[0];
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
});

module.exports = router;

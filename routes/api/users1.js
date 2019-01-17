// I have never worked with DynamoDB before.
// I completed the assessment with MongoDB
// and was hoping to convert over everything
// to DynamoDB, but ran out of time

const AWS = require('aws-sdk');
const express = require('express');
const router = express.Router();
const config = require('../../config/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Gets all users
router.get('/get', (req, res, next) => {
  AWS.config.update(config.aws_remote_config);
  const docClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: config.aws_table_name
  };
  docClient.scan(params, (err, data) => {
    if (err) {
      res.send({
        success: false,
        message: 'Error: Server error'
      });
    } else {
      const { Items } = data;
      res.send({
        success: true,
        message: 'Loaded users',
        users: Items
      });
    }
  });
});

// @route   GET api/users/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => {
  AWS.config.update(config.aws_remote_config);
  const { errors, isValid } = validateRegisterInput(req.body);
  const { username, name, email, password, plan } = req.body;

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
      ':i': username
    }
  };
  docClient.query(params, (err, user) => {
    if (err) {
      res.status(500).json({ Error: err.message });
    }

    if (user.Count > 0) {
      // If user exists, return error
      console.log(user);
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

      // Encrypt data before storing in DB
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            throw err;
          }

          const newUser = {
            TableName: config.aws_table_name,
            Item: {
              username,
              name,
              email,
              password: hash,
              plan
            }
          };
          docClient.put(newUser, (err, data) => {
            if (err) {
              res.send({
                success: false,
                message: 'Error: Server error'
              });
            } else {
              console.log('data', data);
              res.json({
                success: true,
                message: 'Added new user'
              });
            }
          });
        });
      });
    }
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
  AWS.config.update(config.aws_local_config);
  const docClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: config.aws_table_name,
    KeyConditionExpression: 'username = :i',
    ExpressionAttributeValues: {
      ':i': username
    }
  };
  docClient.query(params, (err, user) => {
    if (err) {
      res.status(500).json({ Error: err.message });
    }

    // Check if user is found
    if (user.Count === 0) {
      errors.username = 'Username not found';
      return res.status(404).json(errors);
    } else {
      // Verify password
      hashPassword = user.Items[0].password;
      bcrypt.compare(password, hashPassword).then(isMatch => {
        if (isMatch) {
          // Create JWT Payload
          const payload = {
            id: user.id,
            name: user.name,
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
    }
  });
});

module.exports = router;

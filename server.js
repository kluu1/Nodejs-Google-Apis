require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const users = require('./routes/api/users');
const geocoding = require('./routes/api/geocoding');
const timezone = require('./routes/api/timezone');

// Setup express
const PORT = process.env.PORT || 3000;
const app = express();

// Setup body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setup passport middleware
app.use(passport.initialize());

// Passport config
require('./config/passport.js')(passport);

// User routes
app.use('/api/users', users);
app.use('/api/geocoding', geocoding);
app.use('/api/timezone', timezone);

// Start the express server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

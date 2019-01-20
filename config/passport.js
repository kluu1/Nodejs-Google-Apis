require('dotenv').config();
const AWS = require('aws-sdk');
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const config = require('config');
const keys = process.env.SECRET_OR_KEY;
AWS.config.update(config.get('aws_remote_config'));

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = keys;

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      // Search for user in database
      const docClient = new AWS.DynamoDB.DocumentClient();
      const params = {
        TableName: config.aws_table_name,
        KeyConditionExpression: 'username = :i',
        ExpressionAttributeValues: {
          ':i': jwt_payload.username,
        },
      };
      docClient.query(params, (err, user) => {
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      });
    }),
  );
};

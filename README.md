# Node.js with Google APIs

## Summary
This is a backend api service that leverages Google's Geocoding and Timezone API. The application was developed to be deployed on AWS leveraging DynamoDB.

Users will be able to do the following below:

* Register new user
  * Required fields: username, name, email, password, plan
  * User will recieve 10, 20, or 30 tokens based on plan selected (basic, plus, premium)
* Login with username and password (returns jwt token)
* Make requests to geocoding api for 1 credits
* Make requests to timezone api for 2 credits
* Make a batch request to geocoding api that will run 5 calls concurrently
* Users are limited to 15 requests per hour
* Users will not be able to make anymore requests if they do not have enough credits

## Modules used
* Express
* Aws-sdk
* Body-Parser
* Passport
* Jsonwebtoken
* Bcrypt
* Validator
* Express-Rate-Limit

## Routes
* POST /api/users/register
  - Required: username, name, password, plan
* POST /api/users/login
  - Required: username, password
* POST /api/geocoding
  - Required: JWT Token, address
* POST /api/geocoding/batch
  - Required: JWT Token, Object with array of addresses
  - { "addresses": [ "3200 Holcomb Bridge Rd", "5805 State Bridge Rd" }
* POST /api/timezone
  - Required: JWT Token

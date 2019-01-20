# Node.js Assessment

## Summary
This is a backend api service which will allow new and exisiting user to do the follow:
* Register new user
  * Required inputs: username, name, email, password, plan
  * User will recieve 10, 20, or 30 tokens based on plan selected
* Login with username and password (returns jwt token)
* Make requests to geocoding api for 1 credits
* Make requests to timezone api for 2 credits
* Make a batch request to geocoding api that will run 5 calls concurrently
* Users can only make max of 15 requests per hour
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
* POST api/users/register
  - Required: username, name, password, plan
* POST api/users/login
  - Required: username, password
* POST api/geocoding
  - Required: JWT Token, address
* POST api/geocoding/batch
  - Required: JWT Token, Object with array of addresses
  - { "addresses": [ "3200 Holcomb Bridge Rd", "5805 State Bridge Rd" }
* POST POST api/timezone
  - Required: JWT Token

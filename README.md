# Node.js Assessment

## Summary
This is a backend api service which will allow new and exisiting user to do the follow:
* Register new user
  * Required inputs: username, name, email, password, plan
  * User will recieve 10, 20, or 30 tokens based on plan selected
* Login with username and password (returns jwt token)
* Make requests to geocoding api for 1 credits
* Make requests to timezone api for 2 credits
* Users can only make max of 15 requests per hour
* Users will not be able to make anymore requests if they do not have enough credits

## TODOS
* Convert DB from MongoDB to DynamoDB
* Add more sophisticated validations for all api endpoints
* Debug batch api route, storing axios response into results array

## Modules used
* Express
* MongoDB
* Mongoose
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
  - Required: JWT Token
* POST POST api/timezone
  - Required: JWT Token

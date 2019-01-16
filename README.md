# Node.js Assessment

## Summary
This is a backend api service which will allow new and exisiting user to do the follow:
* Register new user
  * Required inputs: name, email, password, plan
  * User will recieve 10, 20, or 30 tokens based on plan selected
* Login with email and password (returns jwt token)
* Make requests to geocoding api for 1 credits
* Make requests to timezone api for 2 credits
* Users will not be able to make anymore requests if they do not have enough credits

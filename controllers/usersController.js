const AWS = require('aws-sdk');
const config = require('config');
// Set AWS config
AWS.config.update(config.get('aws_remote_config'));

module.exports = {
  // Get user data by username
  getUserInfo: async function getUserInfo(username) {
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName: config.get('aws_table_name'),
      KeyConditionExpression: 'username = :i',
      ExpressionAttributeValues: {
        ':i': username,
      },
    };
    // Create async function to get user credits
    async function getUserData(inputParam) {
      return new Promise(resolve => docClient.query(inputParam, (err, response) => {
        resolve({ response });
      }));
    }
    // Return user credits
    const returnCredits = await getUserData(params);
    return (returnCredits.response.Items[0]);
  },

  // Create new user
  createUser: async function createUser(newUser) {
    const docClient = new AWS.DynamoDB.DocumentClient();
    // Create async function to create new user
    async function createNewUser(params) {
      return new Promise(resolve => docClient.put(params, (err, response) => {
        resolve({ response });
      }));
    }
    // Return response after creating user
    const returnResponse = await createNewUser(newUser);
    return (returnResponse.response);
  },

  // Update user credits
  setCredits: async function setCredits(username, newCredits) {
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName: config.aws_table_name,
      Key: { username },
      UpdateExpression: 'set credits = :c',
      ExpressionAttributeValues: { ':c': newCredits },
      ReturnValues: 'UPDATED_NEW',
    };
    // Create async function to get user credits
    async function setNewCredits(inputParam) {
      return new Promise(resolve => docClient.update(inputParam, (err, response) => {
        resolve({ response });
      }));
    }
    // Return user credits
    const returnCredits = await setNewCredits(params);
    return (returnCredits.response.Attributes.credits);
  },
};

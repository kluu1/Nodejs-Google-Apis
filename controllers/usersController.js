const AWS = require('aws-sdk');
const config = require('config');

AWS.config.update(config.get('aws_remote_config'));

module.exports = {
  // Get credits by searching database by username
  getCredits: async function getCredits(username) {
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName: config.get('aws_table_name'),
      KeyConditionExpression: 'username = :i',
      ExpressionAttributeValues: {
        ':i': username,
      },
    };
    // Create async function to get user credits
    async function getUserCredits(inputParam) {
      return new Promise(resolve => docClient.query(inputParam, (err, response) => {
        resolve({ response });
      }));
    }
    // Return user credits
    const returnCredits = await getUserCredits(params);
    return (returnCredits.response.Items[0].credits);
  },
  // Function to set new value for user credits
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

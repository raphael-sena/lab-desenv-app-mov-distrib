const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { makeDdbDocClient } = require("../lib/aws");
const { json } = require("../lib/response");

module.exports.handler = async () => {
  const ddb = makeDdbDocClient();
  const result = await ddb.send(new ScanCommand({
    TableName: process.env.DDB_TABLE
  }));

  return json(200, { items: result.Items || [] });
};

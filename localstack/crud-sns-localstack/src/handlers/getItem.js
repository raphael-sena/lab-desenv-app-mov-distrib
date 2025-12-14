const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const { makeDdbDocClient } = require("../lib/aws");
const { json } = require("../lib/response");

module.exports.handler = async (event) => {
  const id = event?.pathParameters?.id;
  if (!id) return json(400, { message: "Missing path parameter 'id'." });

  const ddb = makeDdbDocClient();
  const result = await ddb.send(new GetCommand({
    TableName: process.env.DDB_TABLE,
    Key: { id }
  }));

  if (!result.Item) {
    return json(404, { message: "Item not found." });
  }

  return json(200, result.Item);
};

const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { makeDdbDocClient } = require("../lib/aws");
const { json } = require("../lib/response");

module.exports.handler = async (event) => {
  const id = event?.pathParameters?.id;
  if (!id) return json(400, { message: "Missing path parameter 'id'." });

  const ddb = makeDdbDocClient();

  const res = await ddb.send(new DeleteCommand({
    TableName: process.env.DDB_TABLE,
    Key: { id },
    ConditionExpression: "attribute_exists(id)",
    ReturnValues: "ALL_OLD"
  })).catch((err) => {
    if (err?.name === "ConditionalCheckFailedException") return null;
    throw err;
  });

  if (!res) {
    return json(404, { message: "Item not found." });
  }

  return json(200, { deleted: res.Attributes });
};

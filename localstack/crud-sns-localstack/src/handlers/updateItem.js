const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { PublishCommand } = require("@aws-sdk/client-sns");

const { makeDdbDocClient, makeSnsClient } = require("../lib/aws");
const { json } = require("../lib/response");
const { parseJsonBody, validateItemPayload } = require("../lib/validation");

module.exports.handler = async (event) => {
  const id = event?.pathParameters?.id;
  if (!id) return json(400, { message: "Missing path parameter 'id'." });

  const payload = parseJsonBody(event);
  if (payload === null) {
    return json(400, { message: "Invalid JSON body." });
  }

  const validation = validateItemPayload(payload);
  if (!validation.ok) {
    return json(422, { message: "Validation failed.", errors: validation.errors });
  }

  const now = new Date().toISOString();

  const ddb = makeDdbDocClient();
  const sns = makeSnsClient();

  const result = await ddb.send(new UpdateCommand({
    TableName: process.env.DDB_TABLE,
    Key: { id },
    UpdateExpression: "SET #name = :name, #desc = :desc, updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#name": "name",
      "#desc": "description"
    },
    ExpressionAttributeValues: {
      ":name": payload.name.trim(),
      ":desc": payload.description?.trim() ?? null,
      ":updatedAt": now
    },
    ConditionExpression: "attribute_exists(id)",
    ReturnValues: "ALL_NEW"
  })).catch((err) => {
    if (err?.name === "ConditionalCheckFailedException") return null;
    throw err;
  });

  if (!result) {
    return json(404, { message: "Item not found." });
  }

  const updated = result.Attributes;

  // SNS notification (required for create or update)
  await sns.send(new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Message: JSON.stringify({ event: "ITEM_UPDATED", item: updated }),
    Subject: "ITEM_UPDATED"
  }));

  return json(200, updated);
};

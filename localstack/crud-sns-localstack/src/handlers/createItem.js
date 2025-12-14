const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { PublishCommand } = require("@aws-sdk/client-sns");
const { v4: uuidv4 } = require("uuid");

const { makeDdbDocClient, makeSnsClient } = require("../lib/aws");
const { json } = require("../lib/response");
const { parseJsonBody, validateItemPayload } = require("../lib/validation");

module.exports.handler = async (event) => {
  const payload = parseJsonBody(event);
  if (payload === null) {
    return json(400, { message: "Invalid JSON body." });
  }

  const validation = validateItemPayload(payload);
  if (!validation.ok) {
    return json(422, { message: "Validation failed.", errors: validation.errors });
  }

  const now = new Date().toISOString();
  const item = {
    id: uuidv4(),
    name: payload.name.trim(),
    description: payload.description?.trim(),
    createdAt: now,
    updatedAt: now
  };

  const ddb = makeDdbDocClient();
  const sns = makeSnsClient();

  await ddb.send(new PutCommand({
    TableName: process.env.DDB_TABLE,
    Item: item,
    ConditionExpression: "attribute_not_exists(id)"
  }));

  // SNS notification (required for create or update)
  await sns.send(new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Message: JSON.stringify({ event: "ITEM_CREATED", item }),
    Subject: "ITEM_CREATED"
  }));

  return json(201, item);
};

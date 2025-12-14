const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { SNSClient } = require("@aws-sdk/client-sns");

function resolveEndpoint() {
  // You can override explicitly for any environment:
  // AWS_ENDPOINT_URL=http://localhost:4566
  if (process.env.AWS_ENDPOINT_URL) return process.env.AWS_ENDPOINT_URL;

  // When running inside LocalStack, this env var is usually present
  // (but we keep a safe fallback for local/dev).
  const host = process.env.LOCALSTACK_HOSTNAME;
  if (host) return `http://${host}:4566`;

  return "http://localhost:4566";
}

function makeDdbDocClient() {
  const endpoint = resolveEndpoint();
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    endpoint,
    credentials: { accessKeyId: "test", secretAccessKey: "test" }
  });
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true }
  });
}

function makeSnsClient() {
  const endpoint = resolveEndpoint();
  return new SNSClient({
    region: process.env.AWS_REGION || "us-east-1",
    endpoint,
    credentials: { accessKeyId: "test", secretAccessKey: "test" }
  });
}

module.exports = {
  makeDdbDocClient,
  makeSnsClient
};

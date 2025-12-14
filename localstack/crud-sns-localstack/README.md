# CRUD Serverless + SNS (LocalStack)

This project implements **Option A** of the assignment:
- REST CRUD endpoints for `/items`
- One Lambda per operation (Create, Read, Update, Delete)
- DynamoDB for persistence
- SNS notification on create + update
- A subscriber that receives SNS notifications (Lambda subscribed to the topic)
- Local AWS simulation using LocalStack

## Prerequisites
- Node.js 18+ (recommended 20)
- Docker + Docker Compose
- Serverless Framework (installed via `npm i` in this repo)

## Setup
```bash
npm install
docker compose up -d
```

## Deploy to LocalStack
```bash
npm run deploy:local
npm run logs:subscriber
```

### Discover your API URL
```bash
npx serverless info --stage local
```

LocalStack usually prints something like:
`https://<api-id>.execute-api.localhost.localstack.cloud:4566/local`

So your endpoints become:
- `POST   <base>/items`
- `GET    <base>/items`
- `GET    <base>/items/{id}`
- `PUT    <base>/items/{id}`
- `DELETE <base>/items/{id}`

## Example requests (cURL)

> Replace `<base>` with the URL from `serverless info`.

Create:
```bash
curl -s -X POST "<base>/items"   -H "Content-Type: application/json"   -d '{"name":"Café","description":"item de teste"}' | jq .
```

List:
```bash
curl -s "<base>/items" | jq .
```

Get by id:
```bash
curl -s "<base>/items/<id>" | jq .
```

Update:
```bash
curl -s -X PUT "<base>/items/<id>"   -H "Content-Type: application/json"   -d '{"name":"Café atualizado","description":"nova descrição"}' | jq .
```

Delete:
```bash
curl -s -X DELETE "<base>/items/<id>" | jq .
```

## AWS CLI (LocalStack) quick checks
If you have AWS CLI installed:

```bash
bash scripts/aws-local.sh dynamodb list-tables
bash scripts/aws-local.sh sns list-topics
```

## Cleaning up
```bash
npm run remove:local
docker compose down -v
```

## Evidence for delivery
- Print the output of `serverless info --stage local`
- Show logs for SNS subscriber (`npm run logs:subscriber`)
- Capture cURL requests and responses (or Postman) for CRUD operations

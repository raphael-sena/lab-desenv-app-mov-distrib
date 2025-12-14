\
#!/usr/bin/env bash
set -euo pipefail

echo "==> 1) Ensure LocalStack is up"
docker compose up -d >/dev/null

echo "==> 2) Deploy to LocalStack"
npx serverless deploy --stage local

echo "==> 3) Show endpoints"
npx serverless info --stage local

cat <<'TXT'

Now, call the endpoints using the URL printed by:
  serverless info --stage local

LocalStack usually prints something like:
  https://<api-id>.execute-api.localhost.localstack.cloud:4566/local

So your endpoints become:
  POST   .../items
  GET    .../items
  GET    .../items/{id}
  PUT    .../items/{id}
  DELETE .../items/{id}

Tip:
- Keep another terminal running:
    npm run logs:subscriber

TXT

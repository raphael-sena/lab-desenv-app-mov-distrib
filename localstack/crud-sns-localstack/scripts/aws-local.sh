#!/usr/bin/env bash
set -euo pipefail

# Small helper to run AWS CLI against LocalStack.
# Usage examples:
#   bash scripts/aws-local.sh dynamodb list-tables
#   bash scripts/aws-local.sh sns list-topics

aws --endpoint-url=http://localhost:4566 "$@"

#!/bin/bash

# Deploy get-subscribers Edge Function to Supabase
echo "🚀 Deploying get-subscribers Edge Function..."

supabase functions deploy get-subscribers \
  --project-ref iwovfvrmjaonzqlaavmi \
  --no-verify-jwt

if [ $? -eq 0 ]; then
  echo "✅ get-subscribers function deployed successfully!"
else
  echo "❌ Failed to deploy get-subscribers function"
  exit 1
fi



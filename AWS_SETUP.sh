#!/bin/bash
# AWS Setup Script for Fabricon
# This script will help you configure AWS credentials and initialize Amplify

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  Fabricon AWS Configuration Setup"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Step 1: Configure AWS Credentials
echo "Step 1: Configure AWS Credentials"
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "You have the following AWS account configured:"
echo "  Account ID: 295316348216"
echo "  IAM User: binh"
echo "  Region: us-east-1"
echo ""
echo "Paste your AWS Access Key ID and Secret Access Key when prompted."
echo ""

aws configure --profile default

# Step 2: Verify AWS Credentials
echo ""
echo "Step 2: Verifying AWS Credentials..."
echo "────────────────────────────────────────────────────────────────"

if aws sts get-caller-identity > /dev/null 2>&1; then
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  USER_NAME=$(aws sts get-caller-identity --query Arn --output text | cut -d'/' -f2)
  echo "✅ AWS Authentication successful!"
  echo "  Account: $ACCOUNT_ID"
  echo "  User: $USER_NAME"
  echo ""
else
  echo "❌ Failed to authenticate with AWS"
  echo "Please check your credentials and try again"
  exit 1
fi

# Step 3: Initialize Amplify
echo "Step 3: Initialize AWS Amplify"
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "Initializing Amplify project..."
echo ""
echo "When prompted, use these values:"
echo "  Build Command: pnpm run build"
echo "  Start Command: pnpm run dev"
echo ""

amplify init

# Step 4: Add AWS Services
echo ""
echo "Step 4: Adding AWS Services"
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "Adding Authentication (Cognito)..."

amplify add auth << EOF
No
User Sign-Up, Sign-In, connected with AWS IAM controls (Enables per-user Storage features for images or other content)
corjlauth
corjlIdentityPool
No
No
No
No
Optional
Yes
Email
Yes
Y
API
[accept default]
Y
amplify/backend/api/corjlapi/schema.graphql
Amazon Cognito User Pool
Y
API Key
365
N
EOF

# Step 5: Add GraphQL API
echo ""
echo "Adding GraphQL API..."

amplify add api << EOF
GraphQL
[accept default]
Y
amplify/backend/api/corjlapi/schema.graphql
Amazon Cognito User Pool
Y
API Key
365
N
EOF

# Step 6: Add S3 Storage
echo ""
echo "Adding S3 Storage..."

amplify add storage << EOF
S3
corjlstorage
corjl-fabricon-uploads
Auth and guest users
read/write
read
N
EOF

# Step 7: Deploy
echo ""
echo "Step 7: Deploying to AWS"
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "This may take 5-10 minutes. Deploying AWS resources..."
echo ""

amplify push << EOF
Y
Y
Y
EOF

# Step 8: Configure .env.local
echo ""
echo "Step 8: Configuring Environment Variables"
echo "────────────────────────────────────────────────────────────────"
echo ""

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ Created .env.local from template"
else
  echo "ℹ️  .env.local already exists, skipping copy"
fi

echo ""
echo "Next steps:"
echo "────────────────────────────────────────────────────────────────"
echo "1. Update .env.local with values from AWS outputs:"
echo "   - VITE_COGNITO_USER_POOL_ID"
echo "   - VITE_COGNITO_CLIENT_ID"
echo "   - VITE_APPSYNC_ENDPOINT"
echo "   - VITE_S3_BUCKET"
echo ""
echo "2. Start development:"
echo "   pnpm run dev"
echo ""
echo "3. Test AWS integration:"
echo "   - Open http://localhost:5173"
echo "   - Create an account"
echo "   - Sign in"
echo ""
echo "═══════════════════════════════════════════════════════════════"

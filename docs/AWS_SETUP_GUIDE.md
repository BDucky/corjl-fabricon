# AWS Amplify Setup Guide

## Current Status

✅ pnpm setup complete
✅ Project structure created
✅ Code quality verified (type check, lint, build passing)
⏳ **AWS setup requires manual authentication**

---

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **AWS Amplify CLI** (installed: v14.2.5 ✓)

## Step 1: Authenticate with AWS

### Option A: AWS SSO (Recommended)

```bash
aws sso login --profile your-profile-name
```

### Option B: AWS Access Keys

```bash
aws configure
# Enter:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region: us-west-2
# Default output format: json
```

### Verify Authentication

```bash
aws sts get-caller-identity
```

Output should show your account info (not an expiry message).

---

## Step 2: Initialize Amplify

After authenticating, run:

```bash
amplify init
```

When prompted, provide:

```
Project name: corjl-fabricon
Environment: dev
Default editor: code (or your preference)
App type: javascript
Framework: vue
Source directory: src
Distribution directory: dist
Build command: pnpm run build
Start command: pnpm run dev
Test command: pnpm run test
```

This creates the `.amplify` folder with your configuration.

---

## Step 3: Add Authentication (Cognito)

```bash
amplify add auth
```

When prompted:

```
Do you want to use the default authentication and security configuration? → No

Select the authentication/authorization services that you want to use:
→ User Sign-Up, Sign-In, connected with AWS IAM controls (Enables per-user Storage features for images or other content)

Provide a friendly name: corjlauth

Provide a name for your identityPool: corjlIdentityPool

Allow unauthenticated logins? → No

Do you want to enable Lambda-based custom authentication? → No

Do you want to configure Lambda triggers for custom validation? → No

Do you want to enable custom attributes for the cognito user pool? → No

Do you want to turn on multi-factor authentication (MFA)? → Optional

Do you want to require users to provide an email for verification? → Yes

Do you want to enable account recovery/forgot password functionality? → Yes

Which would you like to implement as the reset mechanism for a user who forgot their password?
→ Email (requires SES)

Enable sign-in with social providers? → No
```

---

## Step 4: Add GraphQL API

```bash
amplify add api
```

When prompted:

```
Select from one of the below mentioned services:
→ GraphQL

Here is the GraphQL API schema:
→ [accept default]

Continue? → Y

Do you have an annotated GraphQL schema? → Y

Provide your schema file path: amplify/backend/api/corjlapi/schema.graphql

Choose the default authorization type for the API:
→ Amazon Cognito User Pool

Configure additional auth types? → Y

Choose the additional authorization types you want to configure for the API:
→ API Key (select)

API Key expiration (in days): 365

Configure conflict detection and resolution? → N
```

---

## Step 5: Add S3 Storage

```bash
amplify add storage
```

When prompted:

```
Select from one of the below mentioned services:
→ S3

Provide a friendly name for your resource that will be used to label this category in the project:
corjlstorage

Provide bucket name:
corjl-fabricon-uploads

Who should have access:
→ Auth and guest users

What kind of access do you want for Authenticated users:
→ read/write

What kind of access do you want for Guest users:
→ read

Do you want to add a Lambda Trigger for your S3 Bucket? → N
```

---

## Step 6: Deploy to AWS

```bash
amplify push
```

When prompted:

```
Are you sure you want to continue? → Y

Do you want to generate code for your newly created GraphQL API? → Y

Do you want to update code for your updated GraphQL API? → Y
```

This will:
- Create Cognito User Pool
- Create AppSync GraphQL API
- Create DynamoDB tables for your schema
- Create S3 bucket
- Generate GraphQL queries/mutations

**This may take 5-10 minutes.**

---

## Step 7: Update Environment Variables

After `amplify push` succeeds, copy the AWS configuration from the output:

```bash
cp .env.example .env.local
```

Edit `.env.local` with values from:
- Cognito User Pool ID: From AWS Cognito console
- Cognito Client ID: From Cognito app integration
- AppSync Endpoint: From AWS AppSync console
- S3 Bucket: `corjl-fabricon-uploads-dev`

Example:
```env
VITE_AWS_REGION=us-west-2
VITE_COGNITO_USER_POOL_ID=us-west-2_xxxxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
VITE_APPSYNC_ENDPOINT=https://xxxxxxxxxxxxxxxx.appsync-api.us-west-2.amazonaws.com/graphql
VITE_S3_BUCKET=corjl-fabricon-uploads-dev
```

---

## Step 8: Verify AWS Setup

```bash
# Start dev server
pnpm run dev
```

Open http://localhost:5173

- Test sign up
- Test sign in
- Check browser console for GraphQL errors
- Verify AWS CloudWatch for logs

---

## Troubleshooting

### "No Amplify backend project files detected"

```bash
# Ensure amplify folder exists
ls amplify/backend/

# If missing, initialize again
amplify init
```

### Cognito email not sending

Check AWS SES sandbox mode:
1. Go to AWS SES Console
2. Verify your email address
3. Request production access

### GraphQL schema errors

Verify schema file:
```bash
ls amplify/backend/api/corjlapi/schema.graphql
```

If missing, recreate it from `docs/IMPLEMENTATION_PLAN.md`

### AppSync not responding

```bash
# Check endpoint in .env.local
# Test with:
curl https://your-endpoint.appsync-api.region.amazonaws.com/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

---

## AWS Resources Created

After successful setup, you'll have:

### Cognito
- **User Pool**: `corjlauth-dev`
- **Identity Pool**: `corjlIdentityPool`
- **App Client**: For web authentication

### AppSync
- **GraphQL API**: `corjlapiv2-dev` (or similar)
- **DynamoDB Tables**:
  - `DesignTemplate-dev`
  - `DesignProject-dev`
  - `ProjectAsset-dev`
  - `ProjectExport-dev`
  - `UserProfile-dev`

### S3
- **Bucket**: `corjl-fabricon-uploads-dev`
- **Folders**:
  - `public/` (public templates)
  - `protected/` (user projects)
  - `private/` (user uploads)

### IAM
- **Roles**: Auth/unauth roles for S3 and DynamoDB access

---

## Testing the Integration

After setup:

```bash
# Run tests
pnpm run test

# Run E2E tests
pnpm run e2e

# Check build
pnpm run build
```

---

## Cleanup (Optional)

If you need to start over:

```bash
# Remove Amplify backend
amplify delete

# Confirm deletion
# Y to remove AWS resources
```

---

## Next Steps

Once AWS is configured:

1. ✅ Run tests: `pnpm run test`
2. ✅ Start Phase 2: Fabric.js 2D editor
3. ✅ Implement object manipulation
4. ✅ Add layer management

---

## Support

- [AWS Amplify Docs](https://docs.amplify.aws/)
- [AppSync Troubleshooting](https://docs.aws.amazon.com/appsync/latest/devguide/troubleshooting.html)
- [Cognito FAQ](https://docs.aws.amazon.com/cognito/latest/developerguide/faq.html)

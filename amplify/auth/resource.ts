import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
    },
  },
  accountRecovery: 'EMAIL_ONLY',
  mfa: {
    status: 'OFF',
  },
  userAttributes: {
    email: {
      mutable: true,
      required: true,
    },
    givenName: {
      mutable: true,
    },
    familyName: {
      mutable: true,
    },
    phoneNumber: {
      mutable: true,
    },
  },
  passwordPolicy: {
    minLength: 12,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialCharacters: true,
  },
});

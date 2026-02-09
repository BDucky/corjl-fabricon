import { defineStorage } from '@aws-amplify/backend';
import { auth } from '../auth/resource';

export const storage = defineStorage({
  name: 'corjlFabricon',
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
    ],
    'protected/{identity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.authenticated.identityId('identity_id').to(['read', 'write', 'delete']),
    ],
    'private/{identity_id}/*': [
      allow.authenticated.privateIamRole.to(['read', 'write', 'delete']),
      allow.authenticated.identityId('identity_id').to(['read', 'write', 'delete']),
    ],
  }),
});

import { a, defineSchema } from '@aws-amplify/backend';

export const schema = defineSchema({
  UserProfile: a
    .model({
      id: a.id().required(),
      userId: a.string().required(),
      displayName: a.string(),
      avatarUrl: a.url(),
      subscriptionTier: a.enum(['FREE', 'PRO', 'ENTERPRISE']).default('FREE'),
      subscriptionExpiresAt: a.datetime(),
      preferences: a.json(),
      projects: a.hasMany('DesignProject', 'userId'),
      templates: a.hasMany('DesignTemplate', 'ownerId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner('userId'),
      allow.private().read(),
    ]),

  DesignTemplate: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      category: a.string(),
      tags: a.string().array(),
      width: a.float().required(),
      height: a.float().required(),
      depth: a.float(),
      modelUrl: a.string(),
      modelThumbnailUrl: a.string(),
      uvMappingData: a.json(),
      layerData: a.json(),
      previewImageUrl: a.string(),
      preview3DImageUrl: a.string(),
      isPremium: a.boolean().default(false),
      isPublic: a.boolean().default(false),
      owner: a.belongsTo('UserProfile', 'ownerId'),
      ownerId: a.string().required(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner('ownerId'),
      allow.public().read(),
    ]),

  DesignProject: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      templateId: a.string(),
      template: a.belongsTo('DesignTemplate', 'templateId'),
      userId: a.string().required(),
      user: a.belongsTo('UserProfile', 'userId'),
      canvasData: a.json(),
      status: a
        .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
        .default('DRAFT'),
      selectedViewAngle: a.string().default('front'),
      lightingPreset: a.string().default('default'),
      thumbnailUrl: a.string(),
      assets: a.hasMany('ProjectAsset', 'projectId'),
      exports: a.hasMany('ProjectExport', 'projectId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner('userId'),
    ]),

  ProjectAsset: a
    .model({
      id: a.id().required(),
      projectId: a.string().required(),
      project: a.belongsTo('DesignProject', 'projectId'),
      assetType: a.enum(['IMAGE', 'FONT', 'MODEL', 'TEXTURE']).required(),
      originalUrl: a.string().required(),
      thumbnailUrl: a.string(),
      usageCount: a.int().default(0),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner('project.userId'),
    ]),

  ProjectExport: a
    .model({
      id: a.id().required(),
      projectId: a.string().required(),
      project: a.belongsTo('DesignProject', 'projectId'),
      exportType: a.enum(['PNG', 'PDF', 'GLB', 'JSON']).required(),
      exportUrl: a.string().required(),
      exportSize: a.int(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner('project.userId'),
    ]),
});

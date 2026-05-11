export const LIST_DESIGNS_BY_ORG = /* GraphQL */ `query ListDesignsByOrg(
  $orgId: ID!
  $designType: DesignType!
  $sortBy: DesignSortFields
  $sortDirection: ModelSortDirection
  $filter: ModelDesignFilterInput
  $limit: Int
  $nextToken: String
) {
  listDesignsByOrg(
    orgId: $orgId
    designType: $designType
    sortBy: $sortBy
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      designId
      designName
      description
      metaDescription
      designType
      editorType
      legacyId
      orderId
      draftVersion
      publishedVersion
      publishedEditorType
      thumbnailFilePath
      orgId
      sellerOrgId
      migrationVersion
      createdAt
      updatedAt
      expirationTime
    }
    nextToken
  }
}`

export const GET_DESIGN = /* GraphQL */ `query GetDesign(
  $designId: ID!
  $designVersionType: DesignVersionType!
  $pageId: Int
  $version: Int
) {
  getDesign(
    designId: $designId
    designVersionType: $designVersionType
    pageId: $pageId
    version: $version
  ) {
    designDetails {
      designId
      version
      pageCount
      designName
      designType
      description
      metaDescription
      orderId
      thumbnailFilePath
      pageMap {
        pageId
        pageThumbnailFilePath
        name
        primary
      }
      pixelsPerUnit
      displayUnit
      pixelDensityUnit
      defaultPageRows
      defaultPageColumns
      defaultPageHeight
      defaultPageWidth
      defaultPageBleed
      defaultDisplayPageBleed
      defaultSectionHeight
      defaultSectionWidth
      editorType
      editorVersion
      orgId
      createdAt
      updatedAt
      expirationTime
    }
  }
}`

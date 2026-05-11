/** Design list item returned by listDesignsByOrg */
export interface DesignListItem {
  designId: string
  designName: string
  description: string | null
  metaDescription: string | null
  designType: string
  editorType: string | null
  legacyId: number | null
  orderId: string | null
  draftVersion: number
  publishedVersion: number
  publishedEditorType: string | null
  thumbnailFilePath: string | null
  orgId: string
  sellerOrgId: string | null
  migrationVersion: number | null
  createdAt: string | null
  updatedAt: string | null
  expirationTime: number | null
}

export interface DesignListResponse {
  listDesignsByOrg: {
    items: DesignListItem[]
    nextToken: string | null
  }
}

/** Page info within a design */
export interface DesignPageMap {
  pageId: number
  pageThumbnailFilePath: string | null
  name: string | null
  primary: boolean | null
}

/** Design details returned by getDesign */
export interface DesignDetails {
  designId: string
  version: number
  pageCount: number
  designName: string
  designType: string
  description: string | null
  metaDescription: string | null
  orderId: string | null
  thumbnailFilePath: string | null
  pageMap: DesignPageMap[] | null
  pixelsPerUnit: number | null
  displayUnit: string | null
  pixelDensityUnit: string | null
  defaultPageRows: number | null
  defaultPageColumns: number | null
  defaultPageHeight: number | null
  defaultPageWidth: number | null
  defaultPageBleed: number | null
  defaultDisplayPageBleed: boolean | null
  defaultSectionHeight: number | null
  defaultSectionWidth: number | null
  editorType: string | null
  editorVersion: number | null
  orgId: string
  createdAt: string | null
  updatedAt: string | null
  expirationTime: number | null
}

export interface GetDesignResponse {
  getDesign: {
    designDetails: DesignDetails
  }
}

/** Supported design types — matches Corjl AppSync DesignType enum */
export type DesignType =
  | 'STATIC'
  | 'COMPOSITION'
  | 'CUSTOM_IMPORT'
  | 'IMPORT'
  | 'TEMPLATE'
  | 'BLANK_PRODUCT'
  | 'PRODUCT'
  | 'ORDER'
  | 'SAMPLE'
  | 'INSTRUCTIONS'
  | 'MOCKUP'

/** Sort fields supported by the API */
export type DesignSortField = 'designName' | 'createdAt' | 'updatedAt'

/** Sort direction */
export type SortDirection = 'ASC' | 'DESC'

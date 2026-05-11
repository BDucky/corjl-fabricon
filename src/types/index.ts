// User and Auth types
export interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE'
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Project types
export interface DesignTemplate {
  id: string
  name: string
  description?: string
  category: string
  isPremium: boolean
  isPublic: boolean
  owner: string
  width: number
  height: number
  depth?: number
  modelUrl?: string
  modelThumbnailUrl?: string
  previewImageUrl?: string
  preview3DImageUrl?: string
  tags?: string[]
  version: string
  createdAt: string
  updatedAt: string
}

export interface DesignProject {
  id: string
  name: string
  owner: string
  templateId: string
  template?: DesignTemplate
  canvasData: Record<string, unknown>
  selectedViewAngle: string
  lightingPreset: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  lastModifiedBy?: string
}

export interface ProjectAsset {
  id: string
  projectId: string
  assetType: 'IMAGE' | 'FONT' | 'MODEL' | 'TEXTURE'
  originalUrl: string
  thumbnailUrl?: string
  fileName: string
  fileSize?: number
  mimeType?: string
  owner: string
  usageCount: number
  createdAt: string
}

// Editor types
export interface EditorObject {
  id: string
  type: 'text' | 'shape' | 'image' | 'group'
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  properties: Record<string, unknown>
}

export interface ViewMode {
  type: '3d'
  zoom: number
  panX: number
  panY: number
}

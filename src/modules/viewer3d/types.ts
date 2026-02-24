export type LightingPresetId = 'studio-soft' | 'natural-daylight' | 'dramatic' | 'flat'

export type CameraPresetId = 'front' | 'angle-45' | 'top' | 'custom'

export interface ModelInfo {
  id: string
  name: string
  url: string
  thumbnailUrl: string
  /** Node/mesh names that should receive the user's texture */
  targetMeshNames: string[]
  /** Material names that should receive the user's texture (used when mesh names are generic) */
  targetMaterialNames?: string[]
  bundled: boolean
}

export interface TextureMappingConfig {
  offsetX: number
  offsetY: number
  repeatX: number
  repeatY: number
  rotation: number
}

export interface ExportSettings {
  width: number
  height: number
  transparentBackground: boolean
}

export interface SavedCameraState {
  positionX: number
  positionY: number
  positionZ: number
  targetX: number
  targetY: number
  targetZ: number
}

export interface LightingPreset {
  id: LightingPresetId
  name: string
  description: string
  ambientColor: string
  ambientIntensity: number
  lights: Array<{
    type: 'directional' | 'point' | 'spot'
    color: string
    intensity: number
    position: [number, number, number]
    castShadow?: boolean
  }>
}

export interface CameraPreset {
  id: CameraPresetId
  name: string
  position: [number, number, number]
  target: [number, number, number]
}

// Design input types
export interface DesignInput {
  url: string
  width: number
  height: number
  name?: string
}

export interface ProductSuggestion {
  model: ModelInfo
  score: number
  reason: string
}

export interface AspectRatioProfile {
  minRatio: number
  maxRatio: number
  idealRatio: number
}

export interface ProductColorPreset {
  name: string
  hex: string
}

export interface ExportAngle {
  id: string
  name: string
  position: [number, number, number]
  target: [number, number, number]
}

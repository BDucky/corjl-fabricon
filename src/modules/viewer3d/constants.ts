import type { LightingPreset, CameraPreset, ModelInfo, TextureMappingConfig, ExportSettings } from './types'

export const LIGHTING_PRESETS: LightingPreset[] = [
  {
    id: 'studio-soft',
    name: 'Studio Soft',
    description: 'Even, soft lighting ideal for product shots',
    ambientColor: '#ffffff',
    ambientIntensity: 0.6,
    lights: [
      { type: 'directional', color: '#ffffff', intensity: 0.8, position: [5, 8, 5], castShadow: true },
      { type: 'directional', color: '#e8e0ff', intensity: 0.4, position: [-5, 5, -3] },
      { type: 'directional', color: '#ffe8d6', intensity: 0.3, position: [0, -2, 5] },
    ],
  },
  {
    id: 'natural-daylight',
    name: 'Natural Daylight',
    description: 'Warm sunlight with blue sky fill',
    ambientColor: '#b0c4de',
    ambientIntensity: 0.4,
    lights: [
      { type: 'directional', color: '#fff5e6', intensity: 1.2, position: [8, 10, 4], castShadow: true },
      { type: 'directional', color: '#87ceeb', intensity: 0.3, position: [-4, 6, -2] },
    ],
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'High contrast with strong key light',
    ambientColor: '#1a1a2e',
    ambientIntensity: 0.15,
    lights: [
      { type: 'directional', color: '#ffffff', intensity: 1.5, position: [6, 8, 2], castShadow: true },
      { type: 'directional', color: '#4a00e0', intensity: 0.2, position: [-4, 3, -5] },
    ],
  },
  {
    id: 'flat',
    name: 'Flat',
    description: 'Even lighting with minimal shadows',
    ambientColor: '#ffffff',
    ambientIntensity: 1.0,
    lights: [
      { type: 'directional', color: '#ffffff', intensity: 0.3, position: [5, 5, 5] },
      { type: 'directional', color: '#ffffff', intensity: 0.3, position: [-5, 5, -5] },
    ],
  },
]

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'front', name: 'Front', position: [0, 0, 3], target: [0, 0, 0] },
  { id: 'angle-45', name: '45°', position: [2.1, 1.5, 2.1], target: [0, 0, 0] },
  { id: 'top', name: 'Top', position: [0, 4, 0.01], target: [0, 0, 0] },
  { id: 'custom', name: 'Custom', position: [0, 0, 3], target: [0, 0, 0] },
]

export const BUNDLED_MODELS: ModelInfo[] = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    url: '/models/tshirt.glb',
    thumbnailUrl: '',
    targetMeshNames: ['T_Shirt_male', 'Mesh'],
    bundled: true,
  },
  {
    id: 'polo',
    name: 'Polo Shirt',
    url: '/models/polo.glb',
    thumbnailUrl: '',
    targetMeshNames: ['Short Sleeve Polo_Cotton_Heavy_Canvas_FRONT_232020_0'],
    targetMaterialNames: ['Cotton_Heavy_Canvas_FRONT_232020'],
    bundled: true,
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    url: '/models/hoodie.glb',
    thumbnailUrl: '',
    targetMeshNames: ['Object_3', 'Object_4', 'Object_5'],
    targetMaterialNames: ['HOODIE_FRONT_5197361'],
    bundled: true,
  },
  {
    id: 'tanktop',
    name: 'Tank Top',
    url: '/models/tanktop.glb',
    thumbnailUrl: '',
    targetMeshNames: ['Object_2'],
    targetMaterialNames: ['FABRIC_3_FRONT_2680'],
    bundled: true,
  },
  {
    id: 'totebag',
    name: 'Tote Bag',
    url: '/models/toteBag.glb',
    thumbnailUrl: '',
    targetMeshNames: ['Object_27'],
    targetMaterialNames: ['Mat_Truoc_Tui.002'],
    bundled: true,
  },
  {
    id: 'phonecase',
    name: 'Phone Case',
    url: '/models/phoneCase.glb',
    thumbnailUrl: '',
    targetMeshNames: ['Plane_PBR_0'],
    targetMaterialNames: ['material'],
    bundled: true,
  },
  {
    id: 'coffeemug',
    name: 'Coffee Mug',
    url: '/models/coffeeMug.glb',
    thumbnailUrl: '',
    targetMeshNames: ['Mesh.Mug_White Mug_0'],
    targetMaterialNames: ['White_Mug'],
    bundled: true,
  },
  {
    id: 'cardboardbox',
    name: 'Cardboard Box',
    url: '/models/cardboardBox.glb',
    thumbnailUrl: '',
    targetMeshNames: ['Box_Material_0', 'Box.Big_Material_0', 'Box.Small_Material_0'],
    targetMaterialNames: ['Material'],
    bundled: true,
  },
  {
    id: 'standee',
    name: 'Standee',
    url: '/models/standee.glb',
    thumbnailUrl: '',
    targetMeshNames: [],
    targetMaterialNames: ['material'],
    bundled: true,
  },
]

export const DEFAULT_TEXTURE_MAPPING: TextureMappingConfig = {
  offsetX: 0,
  offsetY: 0,
  repeatX: 1,
  repeatY: 1,
  rotation: 0,
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  width: 1920,
  height: 1080,
  transparentBackground: false,
}

export const DEFAULT_BACKGROUND_COLOR = '#1a1a2e'

export const EXPORT_RESOLUTIONS = [
  { label: '720p', width: 1280, height: 720 },
  { label: '1080p', width: 1920, height: 1080 },
  { label: '2K', width: 2560, height: 1440 },
  { label: '4K', width: 3840, height: 2160 },
] as const

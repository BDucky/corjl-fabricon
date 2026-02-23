// Store
export { useViewer3dStore } from './store'

// Types
export type {
  LightingPresetId,
  CameraPresetId,
  ModelInfo,
  TextureMappingConfig,
  ExportSettings,
  SavedCameraState,
  LightingPreset,
  CameraPreset,
} from './types'

// Constants
export {
  LIGHTING_PRESETS,
  CAMERA_PRESETS,
  BUNDLED_MODELS,
  DEFAULT_TEXTURE_MAPPING,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_BACKGROUND_COLOR,
  EXPORT_RESOLUTIONS,
} from './constants'

// Components
export { default as ThreeViewer } from './components/ThreeViewer.vue'
export { default as ModelLibraryPanel } from './components/ModelLibraryPanel.vue'
export { default as ViewerPropertiesPanel } from './components/ViewerPropertiesPanel.vue'
export { default as ViewerToolbar } from './components/ViewerToolbar.vue'
export { default as ExportDialog } from './components/ExportDialog.vue'

// Store
export { useViewer3dStore } from './store'

// Types
export type {
  LightingPresetId,
  CameraPresetId,
  EnvironmentPresetId,
  SceneStagingPresetId,
  ModelInfo,
  TextureMappingConfig,
  ExportSettings,
  SavedCameraState,
  LightingPreset,
  CameraPreset,
  DesignInput,
  ProductSuggestion,
  AspectRatioProfile,
  ProductColorPreset,
  ExportAngle,
  EnvironmentPreset,
  SceneStagingPreset,
  TurntableExportOptions,
  BatchPreviewItem,
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
  ASPECT_RATIO_PROFILES,
  PRODUCT_COLORS,
  DEFAULT_PRODUCT_COLORS,
  EXPORT_ANGLES,
  ENVIRONMENT_PRESETS,
  SCENE_STAGING_PRESETS,
  TURNTABLE_FRAME_COUNTS,
  TURNTABLE_SPEEDS,
} from './constants'

// Components
export { default as ThreeViewer } from './components/ThreeViewer.vue'
export { default as DesignInputPanel } from './components/DesignInputPanel.vue'
export { default as ViewerPropertiesPanel } from './components/ViewerPropertiesPanel.vue'
export { default as ViewerToolbar } from './components/ViewerToolbar.vue'
export { default as ExportDialog } from './components/ExportDialog.vue'
export { default as ProductColorPicker } from './components/ProductColorPicker.vue'
export { default as DesignPlacementControls } from './components/DesignPlacementControls.vue'
export { default as EnvironmentPresetSelector } from './components/EnvironmentPresetSelector.vue'
export { default as SceneStagingSelector } from './components/SceneStagingSelector.vue'
export { default as BatchPreviewModal } from './components/BatchPreviewModal.vue'

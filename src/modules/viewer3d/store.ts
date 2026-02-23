import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  LightingPresetId,
  CameraPresetId,
  ModelInfo,
  TextureMappingConfig,
  ExportSettings,
} from './types'
import {
  BUNDLED_MODELS,
  LIGHTING_PRESETS,
  CAMERA_PRESETS,
  DEFAULT_TEXTURE_MAPPING,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_BACKGROUND_COLOR,
} from './constants'

export const useViewer3dStore = defineStore('viewer3d', () => {
  // Model state
  const activeModelId = ref<string | null>(null)
  const uploadedModels = ref<ModelInfo[]>([])
  const isModelLoading = ref(false)
  const modelLoadProgress = ref(0)

  // Viewer state
  const lightingPresetId = ref<LightingPresetId>('studio-soft')
  const cameraPresetId = ref<CameraPresetId>('angle-45')
  const backgroundColor = ref(DEFAULT_BACKGROUND_COLOR)
  const autoRotate = ref(false)
  const showGroundShadow = ref(true)

  // Texture state
  const textureUrl = ref<string | null>(null)
  const textureMappingConfig = ref<TextureMappingConfig>({ ...DEFAULT_TEXTURE_MAPPING })

  // Export state
  const exportSettings = ref<ExportSettings>({ ...DEFAULT_EXPORT_SETTINGS })

  // Computed
  const allModels = computed<ModelInfo[]>(() => [
    ...BUNDLED_MODELS,
    ...uploadedModels.value,
  ])

  const activeModel = computed<ModelInfo | undefined>(() =>
    allModels.value.find((m) => m.id === activeModelId.value),
  )

  const hasTexture = computed(() => !!textureUrl.value)
  const hasModel = computed(() => !!activeModelId.value)

  const activeLightingPreset = computed(() =>
    LIGHTING_PRESETS.find((p) => p.id === lightingPresetId.value) ?? LIGHTING_PRESETS[0],
  )

  const activeCameraPreset = computed(() =>
    CAMERA_PRESETS.find((p) => p.id === cameraPresetId.value) ?? CAMERA_PRESETS[0],
  )

  // Actions
  function selectModel(id: string | null) {
    activeModelId.value = id
    if (!id) {
      textureUrl.value = null
      textureMappingConfig.value = { ...DEFAULT_TEXTURE_MAPPING }
    }
  }

  function setLightingPreset(id: LightingPresetId) {
    lightingPresetId.value = id
  }

  function setCameraPreset(id: CameraPresetId) {
    cameraPresetId.value = id
  }

  function setTextureUrl(url: string | null) {
    textureUrl.value = url
  }

  function setTextureMappingConfig(config: Partial<TextureMappingConfig>) {
    textureMappingConfig.value = { ...textureMappingConfig.value, ...config }
  }

  function toggleAutoRotate() {
    autoRotate.value = !autoRotate.value
  }

  function toggleGroundShadow() {
    showGroundShadow.value = !showGroundShadow.value
  }

  function addUploadedModel(model: ModelInfo) {
    uploadedModels.value.push(model)
  }

  function setExportSettings(settings: Partial<ExportSettings>) {
    exportSettings.value = { ...exportSettings.value, ...settings }
  }

  function setModelLoading(loading: boolean, progress = 0) {
    isModelLoading.value = loading
    modelLoadProgress.value = progress
  }

  function reset() {
    activeModelId.value = null
    uploadedModels.value = []
    isModelLoading.value = false
    modelLoadProgress.value = 0
    lightingPresetId.value = 'studio-soft'
    cameraPresetId.value = 'angle-45'
    backgroundColor.value = DEFAULT_BACKGROUND_COLOR
    autoRotate.value = false
    showGroundShadow.value = true
    textureUrl.value = null
    textureMappingConfig.value = { ...DEFAULT_TEXTURE_MAPPING }
    exportSettings.value = { ...DEFAULT_EXPORT_SETTINGS }
  }

  return {
    // State
    activeModelId,
    uploadedModels,
    isModelLoading,
    modelLoadProgress,
    lightingPresetId,
    cameraPresetId,
    backgroundColor,
    autoRotate,
    showGroundShadow,
    textureUrl,
    textureMappingConfig,
    exportSettings,
    // Computed
    allModels,
    activeModel,
    hasTexture,
    hasModel,
    activeLightingPreset,
    activeCameraPreset,
    // Actions
    selectModel,
    setLightingPreset,
    setCameraPreset,
    setTextureUrl,
    setTextureMappingConfig,
    toggleAutoRotate,
    toggleGroundShadow,
    addUploadedModel,
    setExportSettings,
    setModelLoading,
    reset,
  }
})

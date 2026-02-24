import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  LightingPresetId,
  CameraPresetId,
  ModelInfo,
  TextureMappingConfig,
  ExportSettings,
  DesignInput,
  ProductSuggestion,
} from './types'
import {
  BUNDLED_MODELS,
  LIGHTING_PRESETS,
  CAMERA_PRESETS,
  DEFAULT_TEXTURE_MAPPING,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_BACKGROUND_COLOR,
  ASPECT_RATIO_PROFILES,
  MODEL_TEXTURE_DEFAULTS,
} from './constants'

export const useViewer3dStore = defineStore('viewer3d', () => {
  // Model state
  const activeModelId = ref<string | null>(null)
  const uploadedModels = ref<ModelInfo[]>([])
  const isModelLoading = ref(false)
  const modelLoadProgress = ref(0)

  // Design input state
  const designImageUrl = ref<string | null>(null)
  const designDimensions = ref<{ width: number; height: number } | null>(null)
  const designName = ref<string | null>(null)

  // Viewer state
  const lightingPresetId = ref<LightingPresetId>('studio-soft')
  const cameraPresetId = ref<CameraPresetId>('angle-45')
  const backgroundColor = ref(DEFAULT_BACKGROUND_COLOR)
  const autoRotate = ref(false)
  const showGroundShadow = ref(true)

  // Product color state
  const productColor = ref('#ffffff')

  // Texture state
  const textureUrl = ref<string | null>(null)
  const textureMappingConfig = ref<TextureMappingConfig>({ ...DEFAULT_TEXTURE_MAPPING })

  // Export state
  const exportSettings = ref<ExportSettings>({ ...DEFAULT_EXPORT_SETTINGS })
  const isExporting = ref(false)
  const exportProgress = ref(0)

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
  const hasDesign = computed(() => !!designImageUrl.value)

  const activeLightingPreset = computed(() =>
    LIGHTING_PRESETS.find((p) => p.id === lightingPresetId.value) ?? LIGHTING_PRESETS[0],
  )

  const activeCameraPreset = computed(() =>
    CAMERA_PRESETS.find((p) => p.id === cameraPresetId.value) ?? CAMERA_PRESETS[0],
  )

  const designAspectRatio = computed(() => {
    if (!designDimensions.value) return null
    return designDimensions.value.width / designDimensions.value.height
  })

  const productSuggestions = computed<ProductSuggestion[]>(() => {
    const ratio = designAspectRatio.value
    if (ratio === null) return BUNDLED_MODELS.map((m) => ({ model: m, score: 50, reason: 'No design loaded' }))

    return BUNDLED_MODELS.map((model) => {
      const profile = ASPECT_RATIO_PROFILES[model.id]
      if (!profile) return { model, score: 50, reason: 'Compatible' }

      // Score based on how close the design ratio is to the ideal
      if (ratio >= profile.minRatio && ratio <= profile.maxRatio) {
        const distance = Math.abs(ratio - profile.idealRatio)
        const range = profile.maxRatio - profile.minRatio
        const normalized = 1 - (distance / range)
        const score = Math.round(70 + normalized * 30)
        return { model, score, reason: score >= 90 ? 'Best match' : 'Good fit' }
      }

      // Outside range — lower score based on distance
      const distMin = Math.abs(ratio - profile.minRatio)
      const distMax = Math.abs(ratio - profile.maxRatio)
      const dist = Math.min(distMin, distMax)
      const score = Math.max(10, Math.round(60 - dist * 30))
      return { model, score, reason: 'Possible stretch' }
    }).sort((a, b) => b.score - a.score)
  })

  // Actions
  function selectModel(id: string | null) {
    activeModelId.value = id
    if (!id) {
      textureUrl.value = null
      textureMappingConfig.value = { ...DEFAULT_TEXTURE_MAPPING }
    } else if (designDimensions.value) {
      // Re-fit design to the new model
      autoFitDesign()
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

  function resetTextureMapping() {
    textureMappingConfig.value = { ...DEFAULT_TEXTURE_MAPPING }
  }

  function autoFitDesign() {
    const dims = designDimensions.value
    if (!dims) return

    const designRatio = dims.width / dims.height
    const modelId = activeModelId.value
    const defaults = modelId ? MODEL_TEXTURE_DEFAULTS[modelId] : null

    if (!defaults) {
      // Fallback: generic fit (no model-specific data)
      if (designRatio > 1) {
        textureMappingConfig.value = {
          repeatX: 1,
          repeatY: 1 / designRatio,
          offsetX: 0,
          offsetY: (1 - 1 / designRatio) / 2,
          rotation: 0,
        }
      } else {
        textureMappingConfig.value = {
          repeatX: designRatio,
          repeatY: 1,
          offsetX: (1 - designRatio) / 2,
          offsetY: 0,
          rotation: 0,
        }
      }
      return
    }

    // Model-aware fit: compare design ratio to printable area ratio
    const areaRatio = defaults.areaAspectRatio
    const fitRatio = designRatio / areaRatio

    let repeatX: number
    let repeatY: number

    if (fitRatio >= 1) {
      // Design is wider than printable area — fit to width, shrink height
      repeatX = defaults.maxRepeatX
      repeatY = Math.min(defaults.maxRepeatX / fitRatio, defaults.maxRepeatY)
    } else {
      // Design is taller than printable area — fit to height, shrink width
      repeatY = defaults.maxRepeatY
      repeatX = Math.min(defaults.maxRepeatY * fitRatio, defaults.maxRepeatX)
    }

    // Flip V-axis for models with inverted UVs
    if (defaults.flipV) {
      repeatY = -repeatY
    }

    // Center the design within the UV space, then apply model's default offset
    const offsetX = (1 - Math.abs(repeatX)) / 2 + defaults.defaultOffsetX
    const offsetY = defaults.flipV
      ? (1 + Math.abs(repeatY)) / 2 + defaults.defaultOffsetY
      : (1 - repeatY) / 2 + defaults.defaultOffsetY

    textureMappingConfig.value = {
      repeatX,
      repeatY,
      offsetX,
      offsetY,
      rotation: 0,
    }
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

  function setProductColor(color: string) {
    productColor.value = color
  }

  function setDesignFromFile(file: File): Promise<DesignInput> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File must be an image'))
        return
      }

      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        designImageUrl.value = url
        designDimensions.value = { width: img.naturalWidth, height: img.naturalHeight }
        designName.value = file.name
        autoFitDesign()
        textureUrl.value = url

        // Auto-select best matching product if none selected
        if (!activeModelId.value && productSuggestions.value.length > 0) {
          selectModel(productSuggestions.value[0].model.id)
        }

        resolve({ url, width: img.naturalWidth, height: img.naturalHeight, name: file.name })
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = url
    })
  }

  function setDesignFromUrl(url: string): Promise<DesignInput> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        designImageUrl.value = url
        designDimensions.value = { width: img.naturalWidth, height: img.naturalHeight }
        designName.value = null
        autoFitDesign()
        textureUrl.value = url

        // Auto-select best matching product if none selected
        if (!activeModelId.value && productSuggestions.value.length > 0) {
          selectModel(productSuggestions.value[0].model.id)
        }

        resolve({ url, width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => reject(new Error('Failed to load image from URL'))
      img.src = url
    })
  }

  function clearDesign() {
    if (designImageUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(designImageUrl.value)
    }
    designImageUrl.value = null
    designDimensions.value = null
    designName.value = null
    textureUrl.value = null
  }

  function reset() {
    clearDesign()
    activeModelId.value = null
    uploadedModels.value = []
    isModelLoading.value = false
    modelLoadProgress.value = 0
    lightingPresetId.value = 'studio-soft'
    cameraPresetId.value = 'angle-45'
    backgroundColor.value = DEFAULT_BACKGROUND_COLOR
    autoRotate.value = false
    showGroundShadow.value = true
    productColor.value = '#ffffff'
    textureMappingConfig.value = { ...DEFAULT_TEXTURE_MAPPING }
    exportSettings.value = { ...DEFAULT_EXPORT_SETTINGS }
    isExporting.value = false
    exportProgress.value = 0
  }

  return {
    // State
    activeModelId,
    uploadedModels,
    isModelLoading,
    modelLoadProgress,
    designImageUrl,
    designDimensions,
    designName,
    lightingPresetId,
    cameraPresetId,
    backgroundColor,
    autoRotate,
    showGroundShadow,
    productColor,
    textureUrl,
    textureMappingConfig,
    exportSettings,
    isExporting,
    exportProgress,
    // Computed
    allModels,
    activeModel,
    hasTexture,
    hasModel,
    hasDesign,
    activeLightingPreset,
    activeCameraPreset,
    designAspectRatio,
    productSuggestions,
    // Actions
    selectModel,
    setLightingPreset,
    setCameraPreset,
    setTextureUrl,
    setTextureMappingConfig,
    resetTextureMapping,
    autoFitDesign,
    toggleAutoRotate,
    toggleGroundShadow,
    addUploadedModel,
    setExportSettings,
    setModelLoading,
    setProductColor,
    setDesignFromFile,
    setDesignFromUrl,
    clearDesign,
    reset,
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  LightingPresetId,
  CameraPresetId,
  EnvironmentPresetId,
  SceneStagingPresetId,
  ModelInfo,
  TextureMappingConfig,
  ExportSettings,
  DesignInput,
  ProductSuggestion,
  TurntableExportOptions,
  PrintAreaUV,
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
  const isDesignLoading = ref(false)

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

  // Environment map state (Feature 1)
  const environmentPresetId = ref<EnvironmentPresetId | null>(null)
  const environmentIntensity = ref(1.0)

  // Scene staging state (Feature 2)
  const sceneStagingPresetId = ref<SceneStagingPresetId>('none')

  // Print area overlay state (Feature 3)
  const showPrintArea = ref(false)

  // Texture tiling state
  const tileDesign = ref(false)

  // Turntable GIF state (Feature 4)
  const turntableFrameCount = ref(36)
  const turntableFrameDelay = ref(80)

  // Print area state (auto-computed from model UV geometry)
  const computedPrintAreaUV = ref<PrintAreaUV | null>(null)
  const computedFlipV = ref(false)

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

  /** Effective print area: manual override → auto-computed → full canvas fallback */
  const effectivePrintAreaUV = computed<PrintAreaUV>(() => {
    const modelId = activeModelId.value
    const manualOverride = modelId ? MODEL_TEXTURE_DEFAULTS[modelId]?.printAreaUV : undefined
    return manualOverride ?? computedPrintAreaUV.value ?? { minU: 0, maxU: 1, minV: 0, maxV: 1 }
  })

  /** Effective flipV: manual override → auto-detected → false */
  const effectiveFlipV = computed<boolean>(() => {
    const modelId = activeModelId.value
    const manual = modelId ? MODEL_TEXTURE_DEFAULTS[modelId]?.flipV : undefined
    return manual ?? computedFlipV.value
  })

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
    const visibleModels = BUNDLED_MODELS.filter((m) => !m.hidden)
    if (ratio === null) return visibleModels.map((m) => ({ model: m, score: 50, reason: 'No design loaded' }))

    return visibleModels.map((model) => {
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
    if (!designDimensions.value) return

    const modelId = activeModelId.value
    const defaults = modelId ? MODEL_TEXTURE_DEFAULTS[modelId] : null
    const decorationScale = defaults?.decorationScale ?? 0.80

    textureMappingConfig.value = {
      repeatX: decorationScale,
      repeatY: decorationScale,
      offsetX: 0.5,
      offsetY: 0.5,
      rotation: 0,
    }
  }

  function setComputedPrintArea(uv: PrintAreaUV | null, flipV = false) {
    computedPrintAreaUV.value = uv
    computedFlipV.value = flipV
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

  function setDesignLoading(loading: boolean) {
    isDesignLoading.value = loading
  }

  function setProductColor(color: string) {
    productColor.value = color
  }

  function setEnvironmentPreset(id: EnvironmentPresetId | null) {
    environmentPresetId.value = id
  }

  function setEnvironmentIntensity(val: number) {
    environmentIntensity.value = val
  }

  function setSceneStagingPreset(id: SceneStagingPresetId) {
    sceneStagingPresetId.value = id
  }

  function togglePrintArea() {
    showPrintArea.value = !showPrintArea.value
  }

  function toggleTileDesign() {
    tileDesign.value = !tileDesign.value
  }

  function setTurntableSettings(opts: TurntableExportOptions) {
    if (opts.frameCount !== undefined) turntableFrameCount.value = opts.frameCount
    if (opts.frameDelay !== undefined) turntableFrameDelay.value = opts.frameDelay
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
      // Intentionally omit crossOrigin here — we only need naturalWidth/Height,
      // which works without CORS. The compositor's own image load in
      // useTextureMapper handles crossOrigin for canvas sampling.
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
    tileDesign.value = false
    environmentPresetId.value = null
    environmentIntensity.value = 1.0
    sceneStagingPresetId.value = 'none'
    showPrintArea.value = false
    turntableFrameCount.value = 36
    turntableFrameDelay.value = 80
    computedPrintAreaUV.value = null
    computedFlipV.value = false
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
    isDesignLoading,
    designImageUrl,
    designDimensions,
    designName,
    lightingPresetId,
    cameraPresetId,
    backgroundColor,
    autoRotate,
    showGroundShadow,
    productColor,
    tileDesign,
    environmentPresetId,
    environmentIntensity,
    sceneStagingPresetId,
    showPrintArea,
    turntableFrameCount,
    turntableFrameDelay,
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
    effectivePrintAreaUV,
    effectiveFlipV,
    // Actions
    selectModel,
    setComputedPrintArea,
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
    setDesignLoading,
    setProductColor,
    setEnvironmentPreset,
    setEnvironmentIntensity,
    setSceneStagingPreset,
    togglePrintArea,
    toggleTileDesign,
    setTurntableSettings,
    setDesignFromFile,
    setDesignFromUrl,
    clearDesign,
    reset,
  }
})

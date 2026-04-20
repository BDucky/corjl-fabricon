import type { LightingPreset, CameraPreset, ModelInfo, TextureMappingConfig, ExportSettings, AspectRatioProfile, ProductColorPreset, ExportAngle, ModelTextureDefaults, EnvironmentPreset, SceneStagingPreset } from './types'

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

export const ASPECT_RATIO_PROFILES: Record<string, AspectRatioProfile> = {
  tshirt: { minRatio: 0.7, maxRatio: 1.3, idealRatio: 0.85 },
  polo: { minRatio: 0.7, maxRatio: 1.3, idealRatio: 0.85 },
  hoodie: { minRatio: 0.7, maxRatio: 1.3, idealRatio: 0.9 },
  tanktop: { minRatio: 0.6, maxRatio: 1.2, idealRatio: 0.8 },
  totebag: { minRatio: 0.7, maxRatio: 1.2, idealRatio: 0.9 },
  phonecase: { minRatio: 0.4, maxRatio: 0.8, idealRatio: 0.5 },
  coffeemug: { minRatio: 1.5, maxRatio: 4.0, idealRatio: 2.5 },
  cardboardbox: { minRatio: 1.0, maxRatio: 3.0, idealRatio: 1.5 },
  standee: { minRatio: 0.3, maxRatio: 0.9, idealRatio: 0.6 },
}

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
    hidden: true,
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

export const MODEL_TEXTURE_DEFAULTS: Record<string, ModelTextureDefaults> = {
  // T-shirt: front panel UV centroid measured at (0.262, 0.256). Print area is sized to
  // cover the chest region without extending too far into the collar/waist.
  tshirt: {
    printAreaUV: { minU: 0.08, maxU: 0.44, minV: 0.14, maxV: 0.38 },
    decorationScale: 0.85,
  },
  // Polo: UVs span [-2.3, 2.3] with tiling; only the [0,1] tile is sampled (clamp wrap).
  // Front-chest centroid measured at (0.574, 0.479). Print area is centered on the
  // centroid and sized to fill most of the [0,1] tile so the design covers as much of
  // the chest as the polo's UV layout allows.
  polo: {
    printAreaUV: { minU: 0.25, maxU: 0.90, minV: 0.10, maxV: 0.85 },
    flipV: true,
    decorationScale: 0.80,
  },
  // Hoodie: 3 target meshes share UV space U[0.009, 0.991] V[0.009, 0.846].
  // Combined front-chest centroid is (0.509, 0.622). Print area is centered exactly on
  // the centroid and widened (was 0.30×0.28, now 0.42×0.40) so the design appears
  // visibly large on the chest rather than as a small mark in the middle.
  hoodie: {
    printAreaUV: { minU: 0.30, maxU: 0.72, minV: 0.42, maxV: 0.82 },
    flipV: true,
    decorationScale: 0.85,
  },
  // Tank top: hidden — front panel mesh maps to a narrow horizontal UV band.
  tanktop: {
    printAreaUV: { minU: 0.018, maxU: 0.983, minV: 0.668, maxV: 0.923 },
    decorationScale: 0.80,
  },
  // Tote bag: front face (Object_27) fills nearly full UV [0.01, 0.99]. Margins keep
  // the design clear of seams and handles.
  totebag: {
    printAreaUV: { minU: 0.05, maxU: 0.95, minV: 0.15, maxV: 0.85 },
    flipV: true,
    decorationScale: 0.75,
  },
  // Phone case: back panel occupies the right half of UV space.
  phonecase: {
    printAreaUV: { minU: 0.486, maxU: 0.958, minV: 0.033, maxV: 0.966 },
    flipV: true,
    decorationScale: 0.85,
  },
  // Coffee mug: ships with degenerate UVs (all zeros). We force a cylindrical-Y
  // projection so the design wraps around the mug body. The cylindrical generator runs
  // in WORLD space (the mug's local Y is horizontal — its true up axis is local Z, which
  // the parent matrix maps to world Y), so U/V here are in the world-Y cylindrical space.
  //
  // The seam (U=0/U=1) sits on the -X side. The camera's view direction projected onto
  // the XZ plane points roughly +X+Z (45° preset uses offset +X*0.5 +Y*0.4 +Z*1.0), so
  // the camera-facing centerline of the mug is at u ≈ 0.676. The print area is a ~90°
  // arc centered on that point, large enough that the design is visibly prominent on
  // the front of the mug rather than appearing as a tiny label.
  // The cylindrical generator masks interior surfaces (verts at < 92% of the max radius)
  // so the design doesn't bleed onto the inside of the cup.
  coffeemug: {
    uvProjection: 'cylindrical-y',
    printAreaUV: { minU: 0.55, maxU: 0.80, minV: 0.22, maxV: 0.78 },
    decorationScale: 0.85,
  },
  // Cardboard box: all 3 box meshes share UV U[0.114, 0.937] V[0.077, 0.932].
  // The +Z (front) face occupies U[0.115-0.937] V[0.418-0.932] with centroid (0.459, 0.605).
  // Per-face analysis: V increases going UP on the box (top face +Y centroid V=0.765,
  // bottom face -Y centroid V=0.111), so flipV=true is needed to draw the design
  // right-side up on the front. Print area is centered exactly on the centroid so the
  // design lands in the middle of the front face rather than the upper-third.
  cardboardbox: {
    printAreaUV: { minU: 0.16, maxU: 0.76, minV: 0.42, maxV: 0.79 },
    flipV: true,
    decorationScale: 0.85,
  },
  // Standee: target mesh (material "material") ships without UV data, so the texture
  // mapper generates planar UVs from the panel geometry at load time. The generator
  // runs in WORLD space because the standee's local Y is the panel normal (it's the
  // tiny ~0.04-unit dimension), while local Z is the up axis — the parent matrix
  // rotates so world Y matches local Z. The print area is left unset so it falls back
  // to the auto-computed bounds from the generated planar UVs.
  standee: {
    decorationScale: 0.90,
  },
}

export const DEFAULT_TEXTURE_MAPPING: TextureMappingConfig = {
  offsetX: 0.5,
  offsetY: 0.5,
  repeatX: 0.5,
  repeatY: 0.5,
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

export const PRODUCT_COLORS: Record<string, ProductColorPreset[]> = {
  tshirt: [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Navy', hex: '#1b2a4a' },
    { name: 'Red', hex: '#c0392b' },
    { name: 'Grey', hex: '#7f8c8d' },
  ],
  polo: [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Navy', hex: '#1b2a4a' },
    { name: 'Light Blue', hex: '#5dade2' },
    { name: 'Grey', hex: '#7f8c8d' },
  ],
  hoodie: [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Navy', hex: '#1b2a4a' },
    { name: 'Charcoal', hex: '#2c3e50' },
    { name: 'Burgundy', hex: '#6c2142' },
  ],
  tanktop: [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Red', hex: '#c0392b' },
    { name: 'Blue', hex: '#2980b9' },
    { name: 'Grey', hex: '#7f8c8d' },
  ],
  totebag: [
    { name: 'Natural', hex: '#f5e6c8' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Navy', hex: '#1b2a4a' },
  ],
  phonecase: [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Clear', hex: '#e8e8e8' },
    { name: 'Rose Gold', hex: '#d4a373' },
  ],
  coffeemug: [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Red', hex: '#c0392b' },
    { name: 'Blue', hex: '#2980b9' },
  ],
  cardboardbox: [
    { name: 'Kraft', hex: '#c4a97d' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#1a1a1a' },
  ],
  standee: [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#1a1a1a' },
  ],
}

export const DEFAULT_PRODUCT_COLORS: ProductColorPreset[] = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'Navy', hex: '#1b2a4a' },
  { name: 'Red', hex: '#c0392b' },
  { name: 'Grey', hex: '#7f8c8d' },
]

export const EXPORT_ANGLES: ExportAngle[] = [
  { id: 'front', name: 'Front', position: [0, 0, 3], target: [0, 0, 0] },
  { id: 'angle-45', name: '45° Right', position: [2.1, 1.5, 2.1], target: [0, 0, 0] },
  { id: 'angle-45-left', name: '45° Left', position: [-2.1, 1.5, 2.1], target: [0, 0, 0] },
  { id: 'side-right', name: 'Side Right', position: [3, 0.5, 0], target: [0, 0, 0] },
  { id: 'side-left', name: 'Side Left', position: [-3, 0.5, 0], target: [0, 0, 0] },
  { id: 'back', name: 'Back', position: [0, 0.5, -3], target: [0, 0, 0] },
  { id: 'top-angle', name: 'Top Angle', position: [1.5, 3, 1.5], target: [0, 0, 0] },
  { id: 'low-angle', name: 'Low Angle', position: [1.5, -0.5, 2.5], target: [0, 0.5, 0] },
]

// Feature 1: HDRI Environment Presets
export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  { id: 'studio', name: 'Studio', description: 'Soft studio lighting with reflective panels' },
  { id: 'outdoor', name: 'Outdoor', description: 'Blue sky with bright sun' },
  { id: 'warehouse', name: 'Warehouse', description: 'Industrial space with ceiling lights' },
  { id: 'sunset', name: 'Sunset', description: 'Warm orange-pink horizon glow' },
  { id: 'neutral', name: 'Neutral', description: 'Uniform mid-grey for clean reflections' },
]

// Feature 2: Scene Staging Presets
export const SCENE_STAGING_PRESETS: SceneStagingPreset[] = [
  { id: 'none', name: 'None' },
  { id: 'studio-sweep', name: 'Studio Sweep' },
  { id: 'wooden-table', name: 'Wooden Table' },
  { id: 'marble-surface', name: 'Marble Surface' },
  { id: 'fabric-backdrop', name: 'Fabric Backdrop' },
  { id: 'gradient-sweep', name: 'Gradient Sweep' },
]

// Feature 4: Turntable GIF Export
export const TURNTABLE_FRAME_COUNTS = [
  { label: '24', value: 24 },
  { label: '36', value: 36 },
  { label: '48', value: 48 },
] as const

export const TURNTABLE_SPEEDS = [
  { label: 'Slow', delay: 120 },
  { label: 'Normal', delay: 80 },
  { label: 'Fast', delay: 50 },
] as const

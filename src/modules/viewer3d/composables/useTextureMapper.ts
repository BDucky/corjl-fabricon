import { watch } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'
import { MODEL_TEXTURE_DEFAULTS } from '../constants'
import { composeDesignCanvas } from '../utils/textureCompositor'
import { computeUVBounds } from '../utils/computeUVBounds'
import { generatePlanarUVs } from '../utils/generatePlanarUVs'
import { generateCylindricalUVs } from '../utils/generateCylindricalUVs'

export function useTextureMapper(
  getCurrentModel: () => THREE.Group | null,
) {
  const store = useViewer3dStore()

  let loadedImage: HTMLImageElement | null = null
  let loadedImageUrl: string | null = null
  let compositorCanvas: HTMLCanvasElement | null = null
  let canvasTexture: THREE.CanvasTexture | null = null
  /** Original material colors keyed by material uuid, for restoration on clear */
  const savedMaterialColors = new Map<string, THREE.Color>()

  function isTargetMesh(child: THREE.Mesh, targetMeshNames: string[], targetMaterialNames: string[]): boolean {
    if (targetMeshNames.length === 0 && targetMaterialNames.length === 0) return true
    if (targetMeshNames.includes(child.name)) return true
    if (targetMaterialNames.length > 0) {
      const mat = child.material as THREE.MeshStandardMaterial
      if (mat?.name && targetMaterialNames.includes(mat.name)) return true
    }
    return false
  }

  function getTargetMeshes(): THREE.Mesh[] {
    const model = getCurrentModel()
    if (!model) return []

    const activeModel = store.activeModel
    if (!activeModel) return []

    const targetMeshNames = activeModel.targetMeshNames
    const targetMaterialNames = activeModel.targetMaterialNames ?? []
    const meshes: THREE.Mesh[] = []

    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      if (!isTargetMesh(child, targetMeshNames, targetMaterialNames)) return
      meshes.push(child)
    })

    // Fallback: if no matches, return all meshes
    if (meshes.length === 0) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child)
      })
    }

    return meshes
  }

  function applyTextureToMeshes(texture: THREE.CanvasTexture | null) {
    const meshes = getTargetMeshes()

    for (const mesh of meshes) {
      const current = mesh.material as THREE.MeshStandardMaterial
      if (!current.isMeshStandardMaterial) continue

      if (texture) {
        // Clone once per target mesh so we don't mutate a material that may be
        // shared with non-target primitives in the same GLB. This matches the
        // BatchPreviewModal pipeline and also guarantees the material re-binds
        // to freshly-regenerated geometry UVs (the coffee mug regenerates UVs
        // via generateCylindricalUVs at load time; mutating the pre-rendered
        // material in place leaves its UV buffer state stale).
        if (!savedMaterialColors.has(current.uuid)) {
          savedMaterialColors.set(current.uuid, current.color.clone())
        }
        const clone = current.clone()
        clone.map = texture
        clone.color.set(0xffffff)
        clone.needsUpdate = true
        mesh.material = clone
      } else if (current.map) {
        current.map = null
        const saved = savedMaterialColors.get(current.uuid)
        if (saved) {
          current.color.copy(saved)
          savedMaterialColors.delete(current.uuid)
        }
        current.needsUpdate = true
      }
    }
  }

  function recomposeAndApply() {
    if (!loadedImage) return

    const config = store.textureMappingConfig
    // Read model defaults directly to avoid reactivity timing issues
    const modelId = store.activeModelId
    const modelDefaults = modelId ? MODEL_TEXTURE_DEFAULTS[modelId] : undefined
    const printArea = modelDefaults?.printAreaUV ?? store.effectivePrintAreaUV
    const flipV = modelDefaults?.flipV ?? store.effectiveFlipV

    compositorCanvas = composeDesignCanvas(
      loadedImage,
      {
        designScale: config.repeatX,
        offsetX: config.offsetX,
        offsetY: config.offsetY,
        rotation: config.rotation,
        fill: store.tileDesign,
        backgroundColor: store.productColor,
        flipV,
        printAreaUV: printArea,
      },
      compositorCanvas ?? undefined,
    )

    if (!canvasTexture) {
      canvasTexture = new THREE.CanvasTexture(compositorCanvas)
      canvasTexture.colorSpace = THREE.SRGBColorSpace
      canvasTexture.flipY = false
      canvasTexture.wrapS = THREE.ClampToEdgeWrapping
      canvasTexture.wrapT = THREE.ClampToEdgeWrapping
    } else {
      canvasTexture.needsUpdate = true
    }

    applyTextureToMeshes(canvasTexture)
  }

  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  }

  function clearTexture() {
    applyTextureToMeshes(null)
    if (canvasTexture) {
      canvasTexture.dispose()
      canvasTexture = null
    }
    compositorCanvas = null
    loadedImage = null
    loadedImageUrl = null
  }

  // Watch texture URL changes — load the image, then compose.
  // immediate:true is what fixes the "re-open same design shows no texture"
  // bug: the Pinia store persists textureUrl across navigations, so when the
  // user navigates /editor → /designs → /editor for the SAME design, setting
  // textureUrl to the same value on mount doesn't fire a change-only watcher.
  // The fresh useTextureMapper instance would then never load the image,
  // leaving every model's target meshes at their original GLB color (e.g. the
  // hoodie's dark front material showing through as "black hoodie").
  watch(
    () => store.textureUrl,
    async (url) => {
      if (!url) {
        clearTexture()
        return
      }

      // Already loaded this URL — just recompose
      if (loadedImage && loadedImageUrl === url) {
        recomposeAndApply()
        return
      }

      try {
        const img = await loadImage(url)
        loadedImage = img
        loadedImageUrl = url
        recomposeAndApply()
      } catch (err) {
        console.warn('Failed to load texture:', url, err)
      }
    },
    { immediate: true },
  )

  // Watch mapping config changes (drag-to-reposition, scale)
  watch(
    () => store.textureMappingConfig,
    () => recomposeAndApply(),
    { deep: true },
  )

  // Watch tile design toggle (decoration ↔ fill)
  watch(
    () => store.tileDesign,
    () => recomposeAndApply(),
  )

  // Watch product color changes (canvas background)
  watch(
    () => store.productColor,
    () => recomposeAndApply(),
  )

  // Re-apply when model changes (new model = different print area/flipV)
  watch(getCurrentModel, (model) => {
    if (!model) return
    savedMaterialColors.clear()

    // Force the parent transform chain to be flushed so mesh.matrixWorld is current
    // before we generate UVs from world-space positions.
    model.updateMatrixWorld(true)

    const activeModel = store.activeModel
    if (activeModel) {
      // For target meshes that lack usable UV coordinates (e.g. the standee front
      // panel or coffee mug body), generate procedural UVs so the design has somewhere
      // to map to. Per-model overrides via MODEL_TEXTURE_DEFAULTS.uvProjection.
      // Generators receive the mesh's world matrix so they can project positions into
      // world space — essential for SketchUp-exported models whose local axes don't
      // match world up.
      const projection = MODEL_TEXTURE_DEFAULTS[activeModel.id]?.uvProjection ?? 'auto'
      for (const mesh of getTargetMeshes()) {
        if (projection === 'cylindrical-y') {
          generateCylindricalUVs(mesh.geometry, mesh.matrixWorld)
        } else {
          generatePlanarUVs(mesh.geometry, mesh.matrixWorld)
        }
      }

      // Auto-compute UV bounds from the (possibly newly-generated) UVs
      const bounds = computeUVBounds(
        model,
        activeModel.targetMeshNames,
        activeModel.targetMaterialNames ?? [],
      )
      store.setComputedPrintArea(bounds)
    }

    if (loadedImage) {
      recomposeAndApply()
    }
  })

  // Re-compose when effective print area changes (e.g., model UV bounds computed)
  watch(
    () => store.effectivePrintAreaUV,
    () => {
      if (loadedImage) recomposeAndApply()
    },
  )

  return { applyTextureToMeshes }
}

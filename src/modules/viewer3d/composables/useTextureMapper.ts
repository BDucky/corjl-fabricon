import { watch } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'
import { MODEL_TEXTURE_DEFAULTS } from '../constants'
import { composeDesignCanvas } from '../utils/textureCompositor'
import { computeUVBounds } from '../utils/computeUVBounds'
import { generatePlanarUVs } from '../utils/generatePlanarUVs'
import { generateCylindricalUVs } from '../utils/generateCylindricalUVs'

const SHELL_MARKER = '__decoration_shell__'

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

  /** Returns true iff the active model renders its design via an outer shell. */
  function usesShellDecoration(): boolean {
    const id = store.activeModelId
    return !!(id && MODEL_TEXTURE_DEFAULTS[id]?.decorationShell)
  }

  /** Returns the shell meshes currently attached to target meshes of the active model. */
  function getShellMeshes(): THREE.Mesh[] {
    const shells: THREE.Mesh[] = []
    for (const target of getTargetMeshes()) {
      for (const child of target.children) {
        if (child instanceof THREE.Mesh && child.name === SHELL_MARKER) {
          shells.push(child)
        }
      }
    }
    return shells
  }

  function applyTextureToMeshes(texture: THREE.CanvasTexture | null) {
    // Shell-decorated models (coffee mug): apply texture only to the shell,
    // leaving the underlying mug's materials 100% untouched.
    if (usesShellDecoration()) {
      for (const shell of getShellMeshes()) {
        const mat = shell.material as THREE.MeshStandardMaterial
        mat.map = texture
        shell.visible = texture !== null
        mat.needsUpdate = true
      }
      return
    }

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

  /**
   * Build a decoration shell: a thin outer replica of the target mesh, with
   * cylindrical UVs and a MeshStandardMaterial ready to receive the design.
   * The shell sits just outside the target's wall (world-XZ radial offset) so
   * it can only be seen from outside — it's occluded by the original mug
   * walls when viewed through the opening.
   */
  function createDecorationShell(target: THREE.Mesh): THREE.Mesh {
    const geom = target.geometry.clone()
    // Radial offset in world units. Empirically 0.006 was too small to win the
    // z-fight against the underlying mug wall (the shell never rendered on
    // top). 0.1 is the confirmed-working value — slightly noticeable against
    // the mug's ~0.87-unit radius (model is normalized to max-dim 2) but
    // reliable on every tested GPU.
    expandRadiallyInWorldXZ(geom, target.matrixWorld, 0.1)
    generateCylindricalUVs(geom, target.matrixWorld)
    geom.computeBoundingBox()
    geom.computeBoundingSphere()

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })

    const shell = new THREE.Mesh(geom, material)
    shell.name = SHELL_MARKER
    shell.userData.isDecorationShell = true
    shell.raycast = () => { /* no-op */ }
    shell.visible = true
    target.add(shell)
    return shell
  }

  /** Push each vertex outward in the world XZ plane (cylinder axis = world Y). */
  function expandRadiallyInWorldXZ(
    geom: THREE.BufferGeometry,
    worldMatrix: THREE.Matrix4,
    epsilon: number,
  ) {
    const pos = geom.getAttribute('position') as THREE.BufferAttribute
    const normalAttr = geom.getAttribute('normal') as THREE.BufferAttribute | null
    const normalMatrix = normalAttr ? new THREE.Matrix3().getNormalMatrix(worldMatrix) : null
    const inv = new THREE.Matrix4().copy(worldMatrix).invert()
    const v = new THREE.Vector3()
    const n = new THREE.Vector3()

    // Pass 1: find the world-XZ axis of the cylinder (center point).
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(worldMatrix)
      if (v.x < minX) minX = v.x
      if (v.x > maxX) maxX = v.x
      if (v.z < minZ) minZ = v.z
      if (v.z > maxZ) maxZ = v.z
    }
    const cx = (minX + maxX) / 2
    const cz = (minZ + maxZ) / 2

    // Pass 2: push wall verts (non-vertical normal) outward; leave top/bottom
    // face verts in place so the shell's rim doesn't stick above the mug's.
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(worldMatrix)
      let isWall = true
      if (normalAttr) {
        n.set(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i))
        if (normalMatrix) n.applyNormalMatrix(normalMatrix)
        n.normalize()
        if (Math.abs(n.y) > 0.85) isWall = false
      }
      if (isWall) {
        const dx = v.x - cx
        const dz = v.z - cz
        const r = Math.sqrt(dx * dx + dz * dz)
        if (r > 0.01) {
          const k = (r + epsilon) / r
          v.x = cx + dx * k
          v.z = cz + dz * k
        }
      }
      v.applyMatrix4(inv)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    pos.needsUpdate = true
  }

  /** Remove and dispose any shells currently attached under the given model. */
  function removeShells(model: THREE.Object3D): void {
    const shells: THREE.Mesh[] = []
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === SHELL_MARKER) shells.push(child)
    })
    for (const shell of shells) {
      shell.removeFromParent()
      shell.geometry.dispose()
      const mat = shell.material as THREE.Material
      mat.dispose()
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
        // Abort if the textureUrl changed (or was cleared) while loadImage was
        // in flight. On a fresh editor mount the immediate-watcher fires with
        // the previous session's persisted URL; useURLParams then clears the
        // design a microtask later. Without this guard, the pending load
        // resolves and re-applies the stale design on top of the cleared
        // state — the bug that made empty-design opens still show the old
        // design.
        if (store.textureUrl !== url) return
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
    // Remove any shells left over from a previous mount (shouldn't normally
    // exist since currentModel is a fresh model, but cheap insurance).
    removeShells(model)

    // Force the parent transform chain to be flushed so mesh.matrixWorld is current
    // before we generate UVs from world-space positions.
    model.updateMatrixWorld(true)

    const activeModel = store.activeModel
    if (activeModel) {
      const defaults = MODEL_TEXTURE_DEFAULTS[activeModel.id]
      const useShell = defaults?.decorationShell ?? false

      if (useShell) {
        // Shell-decorated models (e.g. the coffee mug): build one outer shell
        // per target mesh. Don't touch the target mesh's own geometry or
        // material — the underlying GLB renders exactly as the artist
        // authored it, and the design rides on top of it on the shell.
        for (const target of getTargetMeshes()) createDecorationShell(target)
      } else {
        // Standard path: regenerate UVs on the target mesh itself. Cloning
        // the geometry sidesteps a three.js pitfall where mutating UVs on a
        // geometry that's already been rendered leaves the cached VAO / WebGL
        // attribute bindings pointing at the stale buffer.
        const projection = defaults?.uvProjection ?? 'auto'
        for (const mesh of getTargetMeshes()) {
          const fresh = mesh.geometry.clone()
          const ok = projection === 'cylindrical-y'
            ? generateCylindricalUVs(fresh, mesh.matrixWorld)
            : generatePlanarUVs(fresh, mesh.matrixWorld)
          if (ok) {
            const old = mesh.geometry
            mesh.geometry = fresh
            old.dispose()
          } else {
            fresh.dispose()
          }
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

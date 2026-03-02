import { watch } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'

export function useTextureMapper(
  getCurrentModel: () => THREE.Group | null,
) {
  const store = useViewer3dStore()
  const textureLoader = new THREE.TextureLoader()
  let currentTexture: THREE.Texture | null = null
  let loadedTextureUrl: string | null = null

  function isTargetMesh(child: THREE.Mesh, targetMeshNames: string[], targetMaterialNames: string[]): boolean {
    // No targets specified — match all
    if (targetMeshNames.length === 0 && targetMaterialNames.length === 0) return true

    // Match by node/mesh name
    if (targetMeshNames.includes(child.name)) return true

    // Match by material name
    if (targetMaterialNames.length > 0) {
      const mat = child.material as THREE.MeshStandardMaterial
      if (mat?.name && targetMaterialNames.includes(mat.name)) return true
    }

    return false
  }

  function applyTextureToMeshes(texture: THREE.Texture | null) {
    const model = getCurrentModel()
    if (!model) return

    const activeModel = store.activeModel
    if (!activeModel) return

    const targetMeshNames = activeModel.targetMeshNames
    const targetMaterialNames = activeModel.targetMaterialNames ?? []
    let applied = false

    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return

      if (!isTargetMesh(child, targetMeshNames, targetMaterialNames)) return

      const material = child.material as THREE.MeshStandardMaterial
      if (!material.isMeshStandardMaterial) return

      if (texture) {
        material.map = texture
        applied = true
      } else {
        material.map = null
      }
      material.needsUpdate = true
    })

    // If no meshes matched, apply to all meshes as fallback
    if (!applied && texture) {
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        const material = child.material as THREE.MeshStandardMaterial
        if (!material.isMeshStandardMaterial) return
        material.map = texture
        material.needsUpdate = true
      })
    }
  }

  function updateTextureMapping() {
    if (!currentTexture) return

    const config = store.textureMappingConfig
    currentTexture.offset.set(config.offsetX, config.offsetY)
    currentTexture.repeat.set(config.repeatX, config.repeatY)
    currentTexture.rotation = config.rotation
    const wrapMode = store.tileDesign ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
    currentTexture.wrapS = wrapMode
    currentTexture.wrapT = wrapMode
    currentTexture.needsUpdate = true
  }

  function loadAndApplyTexture(url: string) {
    // Already loaded this exact URL — just re-apply
    if (currentTexture && loadedTextureUrl === url) {
      updateTextureMapping()
      applyTextureToMeshes(currentTexture)
      return
    }

    // Dispose previous texture
    if (currentTexture) {
      currentTexture.dispose()
      currentTexture = null
      loadedTextureUrl = null
    }

    textureLoader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        const wrapMode = store.tileDesign ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
        texture.wrapS = wrapMode
        texture.wrapT = wrapMode
        texture.flipY = false
        currentTexture = texture
        loadedTextureUrl = url
        updateTextureMapping()
        applyTextureToMeshes(texture)
      },
      undefined,
      (err) => {
        console.warn('Failed to load texture:', url, err)
      },
    )
  }

  // Watch texture URL changes
  watch(
    () => store.textureUrl,
    (url) => {
      if (!url) {
        if (currentTexture) {
          currentTexture.dispose()
          currentTexture = null
          loadedTextureUrl = null
        }
        applyTextureToMeshes(null)
        return
      }

      loadAndApplyTexture(url)
    },
  )

  // Watch UV mapping config changes
  watch(
    () => store.textureMappingConfig,
    () => {
      updateTextureMapping()
      applyTextureToMeshes(currentTexture)
    },
    { deep: true },
  )

  // Watch tile design toggle
  watch(
    () => store.tileDesign,
    () => {
      updateTextureMapping()
      applyTextureToMeshes(currentTexture)
    },
  )

  // Re-apply texture when the model changes (e.g., user picks a different product)
  // This handles the race condition where the model loads after the texture
  watch(getCurrentModel, (model) => {
    if (!model) return

    const url = store.textureUrl
    if (!url) return

    // If we have the texture loaded, just re-apply to the new model
    if (currentTexture && loadedTextureUrl === url) {
      updateTextureMapping()
      applyTextureToMeshes(currentTexture)
    } else {
      // Texture not loaded yet or URL changed — load and apply
      loadAndApplyTexture(url)
    }
  })

  return { applyTextureToMeshes }
}

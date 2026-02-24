import { watch } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'

export function useTextureMapper(
  getCurrentModel: () => THREE.Group | null,
) {
  const store = useViewer3dStore()
  const textureLoader = new THREE.TextureLoader()
  let currentTexture: THREE.Texture | null = null

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
    currentTexture.wrapS = THREE.RepeatWrapping
    currentTexture.wrapT = THREE.RepeatWrapping
    currentTexture.needsUpdate = true
  }

  // Watch texture URL changes
  watch(
    () => store.textureUrl,
    (url) => {
      if (currentTexture) {
        currentTexture.dispose()
        currentTexture = null
      }

      if (!url) {
        applyTextureToMeshes(null)
        return
      }

      textureLoader.load(url, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.flipY = false
        currentTexture = texture
        updateTextureMapping()
        applyTextureToMeshes(texture)
      })
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

  return { applyTextureToMeshes }
}

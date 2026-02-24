import { watch } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'

export function useProductMaterial(
  getCurrentModel: () => THREE.Group | null,
) {
  const store = useViewer3dStore()

  function isDesignMesh(child: THREE.Mesh): boolean {
    const activeModel = store.activeModel
    if (!activeModel) return false

    const targetMeshNames = activeModel.targetMeshNames
    const targetMaterialNames = activeModel.targetMaterialNames ?? []

    // If no targets specified, all meshes get the design — so none are "product" meshes
    if (targetMeshNames.length === 0 && targetMaterialNames.length === 0) return true

    if (targetMeshNames.includes(child.name)) return true

    const mat = child.material as THREE.MeshStandardMaterial
    if (mat?.name && targetMaterialNames.includes(mat.name)) return true

    return false
  }

  function applyProductColor(color: string) {
    const model = getCurrentModel()
    if (!model) return

    const threeColor = new THREE.Color(color)

    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      if (isDesignMesh(child)) return

      const material = child.material as THREE.MeshStandardMaterial
      if (!material.isMeshStandardMaterial) return

      material.color.copy(threeColor)
      material.needsUpdate = true
    })
  }

  // Watch product color changes
  watch(
    () => store.productColor,
    (color) => {
      applyProductColor(color)
    },
  )

  // Re-apply when model changes
  watch(getCurrentModel, (model) => {
    if (model) {
      applyProductColor(store.productColor)
    }
  })

  return { applyProductColor }
}

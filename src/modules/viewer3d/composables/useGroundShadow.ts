import { shallowRef, watch } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'

export function useGroundShadow(scene: () => THREE.Scene | null) {
  const store = useViewer3dStore()
  const groundMesh = shallowRef<THREE.Mesh | null>(null)

  function createGround() {
    const s = scene()
    if (!s) return

    removeGround()

    const geometry = new THREE.PlaneGeometry(10, 10)
    const material = new THREE.ShadowMaterial({ opacity: 0.3 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = -0.5
    mesh.receiveShadow = true
    mesh.name = '__ground_shadow__'

    s.add(mesh)
    groundMesh.value = mesh
  }

  function removeGround() {
    if (groundMesh.value) {
      groundMesh.value.geometry.dispose()
      ;(groundMesh.value.material as THREE.Material).dispose()
      groundMesh.value.removeFromParent()
      groundMesh.value = null
    }
  }

  /** Update ground Y to sit beneath the loaded model */
  function updateGroundPosition(modelBottomY: number) {
    if (groundMesh.value) {
      groundMesh.value.position.y = modelBottomY - 0.01
    }
  }

  watch(
    () => store.showGroundShadow,
    (show) => {
      if (show) createGround()
      else removeGround()
    },
  )

  function initialize() {
    if (store.showGroundShadow) createGround()
  }

  return { initialize, updateGroundPosition }
}

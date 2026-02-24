import { shallowRef, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useViewer3dStore } from '../store'
import { disposeObject3D } from '../utils/dispose'
import { fitCameraToModel } from '../utils/fitCameraToModel'
import { PROCEDURAL_GENERATORS } from '../utils/proceduralModels'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { ModelInfo } from '../types'

export function useModelLoader(
  scene: () => THREE.Scene | null,
  camera: () => THREE.PerspectiveCamera | null,
  controls: () => OrbitControls | null,
) {
  const store = useViewer3dStore()
  const loader = new GLTFLoader()
  const currentModel = shallowRef<THREE.Group | null>(null)

  function removeCurrentModel() {
    if (currentModel.value) {
      disposeObject3D(currentModel.value)
      currentModel.value = null
    }
  }

  function loadGLB(url: string): Promise<THREE.Group> {
    store.setModelLoading(true, 0)

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene
          centerAndSetupModel(model)
          store.setModelLoading(false)
          resolve(model)
        },
        (progress) => {
          if (progress.total > 0) {
            store.setModelLoading(true, (progress.loaded / progress.total) * 100)
          }
        },
        (error) => {
          store.setModelLoading(false)
          reject(error)
        },
      )
    })
  }

  function loadProcedural(modelId: string): THREE.Group | null {
    const generator = PROCEDURAL_GENERATORS[modelId]
    if (!generator) return null

    const model = generator()
    centerAndSetupModel(model)
    return model
  }

  /** Target size: models are normalized so their largest dimension equals this value */
  const TARGET_SIZE = 2

  function centerAndSetupModel(model: THREE.Group) {
    // 1. Compute original bounding box and normalize scale
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim > 0) {
      const scale = TARGET_SIZE / maxDim
      model.scale.multiplyScalar(scale)
    }

    // 2. Recompute bounding box after scaling, then center at origin
    const scaledBox = new THREE.Box3().setFromObject(model)
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3())
    model.position.sub(scaledCenter)

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }

  async function loadModel(model: ModelInfo): Promise<THREE.Group> {
    // For bundled models, try GLB first, fall back to procedural
    if (model.bundled) {
      try {
        return await loadGLB(model.url)
      } catch {
        // GLB not found — use procedural fallback
        const procedural = loadProcedural(model.id)
        if (procedural) return procedural
        throw new Error(`No GLB or procedural model for "${model.id}"`)
      }
    }

    // For uploaded models, always use GLB loader
    return loadGLB(model.url)
  }

  /** Returns all mesh names in the current model */
  function getMeshNames(): string[] {
    const names: string[] = []
    currentModel.value?.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name) {
        names.push(child.name)
      }
    })
    return names
  }

  // Watch store.activeModel and reactively load
  watch(
    () => store.activeModel,
    async (model) => {
      const s = scene()
      const cam = camera()
      const ctrl = controls()
      if (!s) return

      removeCurrentModel()

      if (!model) return

      try {
        const loaded = await loadModel(model)
        currentModel.value = loaded
        s.add(loaded)

        if (cam && ctrl) {
          fitCameraToModel(loaded, cam, ctrl)
        }
      } catch (err) {
        console.error('Failed to load model:', err)
      }
    },
  )

  return {
    currentModel,
    removeCurrentModel,
    getMeshNames,
  }
}

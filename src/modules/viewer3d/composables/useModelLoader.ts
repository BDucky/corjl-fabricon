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

  // Tracks the last model id we actually loaded into the CURRENT scene instance.
  // This is scoped to this composable (per ThreeViewer mount), so remounting the
  // viewer — e.g. navigating /editor → /designs → /editor — resets it and re-loads
  // even when the store's activeModelId was persisted from the previous session.
  let loadedForSceneModelId: string | null = null

  async function ensureLoaded() {
    const s = scene()
    const cam = camera()
    const ctrl = controls()
    if (!s) return

    const model = store.activeModel
    if (!model) {
      removeCurrentModel()
      loadedForSceneModelId = null
      return
    }

    if (loadedForSceneModelId === model.id && currentModel.value) return

    removeCurrentModel()
    loadedForSceneModelId = model.id

    try {
      const loaded = await loadModel(model)
      // Guard against a newer model change while we were loading.
      if (loadedForSceneModelId !== model.id) {
        disposeObject3D(loaded)
        return
      }
      currentModel.value = loaded
      s.add(loaded)
      if (cam && ctrl) fitCameraToModel(loaded, cam, ctrl)
    } catch (err) {
      console.error('Failed to load model:', err)
      loadedForSceneModelId = null
    }
  }

  // Fires on activeModel change AND on scene initialization. The second trigger
  // is what fixes the "model doesn't render after navigating back to /editor"
  // bug: the Pinia store persists activeModelId across routes, so activeModel
  // doesn't change — but the ThreeViewer is fresh and has no model in its scene.
  watch(
    [() => store.activeModel, scene],
    () => {
      void ensureLoaded()
    },
    { immediate: true },
  )

  return {
    currentModel,
    removeCurrentModel,
    getMeshNames,
  }
}

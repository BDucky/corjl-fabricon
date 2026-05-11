import { watch, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useViewer3dStore } from '../store'

export function useDesignDrag(
  getRenderer: () => THREE.WebGLRenderer | null,
  getCamera: () => THREE.PerspectiveCamera | null,
  getControls: () => OrbitControls | null,
  getCurrentModel: () => THREE.Group | null,
) {
  const store = useViewer3dStore()
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  let isDragging = false
  let lastPointerX = 0
  let lastPointerY = 0
  let canvas: HTMLCanvasElement | null = null
  const SENSITIVITY = 1.0

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

      // Match by mesh name or material name
      const matchesMesh = targetMeshNames.length === 0 || targetMeshNames.includes(child.name)
      const mat = child.material as THREE.MeshStandardMaterial
      const matchesMaterial = targetMaterialNames.length > 0 && mat?.name && targetMaterialNames.includes(mat.name)

      if (matchesMesh || matchesMaterial) {
        meshes.push(child)
      }
    })

    // Fallback: if no matches, return all meshes
    if (meshes.length === 0) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child)
      })
    }

    return meshes
  }

  function hitsTargetMesh(event: PointerEvent): boolean {
    const cam = getCamera()
    if (!cam || !canvas) return false

    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, cam)
    const meshes = getTargetMeshes()
    if (meshes.length === 0) return false

    const intersects = raycaster.intersectObjects(meshes, false)
    return intersects.length > 0
  }

  function onPointerDown(event: PointerEvent) {
    if (!store.hasTexture) return
    if (event.button !== 0) return // left button only

    if (hitsTargetMesh(event)) {
      isDragging = true
      lastPointerX = event.clientX
      lastPointerY = event.clientY

      // Disable orbit controls during drag
      const ctrl = getControls()
      if (ctrl) ctrl.enabled = false

      if (canvas) canvas.style.cursor = 'grabbing'
      event.preventDefault()
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!canvas) return

    if (isDragging) {
      const deltaX = event.clientX - lastPointerX
      const deltaY = event.clientY - lastPointerY
      lastPointerX = event.clientX
      lastPointerY = event.clientY

      // Convert pixel delta to UV offset delta
      const rect = canvas.getBoundingClientRect()
      const deltaOffsetX = (deltaX / rect.width) * SENSITIVITY
      const deltaOffsetY = -(deltaY / rect.height) * SENSITIVITY // invert Y for UV space

      store.setTextureMappingConfig({
        offsetX: store.textureMappingConfig.offsetX + deltaOffsetX,
        offsetY: store.textureMappingConfig.offsetY + deltaOffsetY,
      })

      event.preventDefault()
    } else if (store.hasTexture) {
      // Update cursor on hover
      canvas.style.cursor = hitsTargetMesh(event) ? 'grab' : ''
    }
  }

  function onPointerUp() {
    if (!isDragging) return

    isDragging = false

    // Re-enable orbit controls
    const ctrl = getControls()
    if (ctrl) ctrl.enabled = true

    if (canvas) canvas.style.cursor = 'grab'
  }

  function attach(canvasEl: HTMLCanvasElement) {
    canvas = canvasEl
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerUp)
  }

  function detach() {
    if (!canvas) return
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerUp)
    canvas.style.cursor = ''
    canvas = null
  }

  // Auto-attach when renderer becomes available
  watch(getRenderer, (r) => {
    detach()
    if (r) attach(r.domElement)
  })

  onBeforeUnmount(detach)

  return { isDragging }
}

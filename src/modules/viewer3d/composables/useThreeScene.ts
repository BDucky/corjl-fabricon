import { shallowRef, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function useThreeScene() {
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const controls = shallowRef<OrbitControls | null>(null)

  let animationId: number | null = null
  let resizeObserver: ResizeObserver | null = null
  let container: HTMLElement | null = null

  function init(containerEl: HTMLElement) {
    container = containerEl

    // Scene
    const s = new THREE.Scene()
    scene.value = s

    // Camera
    const aspect = containerEl.clientWidth / containerEl.clientHeight
    const cam = new THREE.PerspectiveCamera(45, aspect, 0.1, 100)
    cam.position.set(2.1, 1.5, 2.1)
    camera.value = cam

    // Renderer
    const r = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true,
    })
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    r.setSize(containerEl.clientWidth, containerEl.clientHeight)
    r.toneMapping = THREE.ACESFilmicToneMapping
    r.toneMappingExposure = 1.0
    r.outputColorSpace = THREE.SRGBColorSpace
    r.shadowMap.enabled = true
    r.shadowMap.type = THREE.PCFSoftShadowMap
    containerEl.appendChild(r.domElement)
    renderer.value = r

    // Controls
    const ctrl = new OrbitControls(cam, r.domElement)
    ctrl.enableDamping = true
    ctrl.dampingFactor = 0.08
    ctrl.minDistance = 0.5
    ctrl.maxDistance = 20
    ctrl.target.set(0, 0, 0)
    ctrl.update()
    controls.value = ctrl

    // Resize
    resizeObserver = new ResizeObserver(() => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      cam.aspect = w / h
      cam.updateProjectionMatrix()
      r.setSize(w, h)
    })
    resizeObserver.observe(containerEl)

    // Render loop
    function animate() {
      animationId = requestAnimationFrame(animate)
      ctrl.update()
      r.render(s, cam)
    }
    animate()
  }

  function getCanvas(): HTMLCanvasElement | null {
    return renderer.value?.domElement ?? null
  }

  function dispose() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    resizeObserver?.disconnect()
    resizeObserver = null

    controls.value?.dispose()
    renderer.value?.dispose()
    renderer.value?.domElement.remove()

    scene.value = null
    camera.value = null
    renderer.value = null
    controls.value = null
    container = null
  }

  onBeforeUnmount(dispose)

  return {
    scene,
    camera,
    renderer,
    controls,
    init,
    dispose,
    getCanvas,
  }
}

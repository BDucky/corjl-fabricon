import { watch } from 'vue'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useViewer3dStore } from '../store'

export function useAutoRotate(controls: () => OrbitControls | null) {
  const store = useViewer3dStore()

  watch(
    () => store.autoRotate,
    (enabled) => {
      const ctrl = controls()
      if (!ctrl) return
      ctrl.autoRotate = enabled
      ctrl.autoRotateSpeed = 2.0
    },
    { immediate: true },
  )

  function initialize() {
    const ctrl = controls()
    if (!ctrl) return
    ctrl.autoRotate = store.autoRotate
    ctrl.autoRotateSpeed = 2.0
  }

  return { initialize }
}

<template>
  <div class="relative w-full h-full">
    <!-- WebGL canvas container -->
    <div
      ref="containerRef"
      class="w-full h-full rounded-lg overflow-hidden"
    />

    <!-- Loading overlay -->
    <LoadingOverlay />

    <!-- Empty state (no model selected) -->
    <Transition name="fade">
      <div
        v-if="!store.hasModel && !store.isModelLoading"
        class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <div class="text-center pointer-events-auto">
          <svg class="w-12 h-12 text-white/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p class="text-white/40 text-sm mb-1">No model loaded</p>
          <p class="text-white/25 text-xs">Select a model from the left panel or upload a GLB file</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'
import { useThreeScene } from '../composables/useThreeScene'
import { useModelLoader } from '../composables/useModelLoader'
import { useLighting } from '../composables/useLighting'
import { useTextureMapper } from '../composables/useTextureMapper'
import { useCameraPresets } from '../composables/useCameraPresets'
import { useGroundShadow } from '../composables/useGroundShadow'
import { useAutoRotate } from '../composables/useAutoRotate'
import { useExporter } from '../composables/useExporter'
import { useProductMaterial } from '../composables/useProductMaterial'
import { useMultiAngleExport } from '../composables/useMultiAngleExport'
import { useDesignDrag } from '../composables/useDesignDrag'
import LoadingOverlay from './LoadingOverlay.vue'

const store = useViewer3dStore()
const containerRef = ref<HTMLElement | null>(null)

const { scene, camera, renderer, controls, init, getCanvas } = useThreeScene()

const { currentModel } = useModelLoader(
  () => scene.value,
  () => camera.value,
  () => controls.value,
)

const lighting = useLighting(() => scene.value)
useTextureMapper(() => currentModel.value)
const cameraPresets = useCameraPresets(() => camera.value, () => controls.value)
const groundShadow = useGroundShadow(() => scene.value)
const autoRotateComposable = useAutoRotate(() => controls.value)
const { exportImage } = useExporter(
  () => renderer.value,
  () => scene.value,
  () => camera.value,
)
useProductMaterial(() => currentModel.value)
useDesignDrag(
  () => renderer.value,
  () => camera.value,
  () => controls.value,
  () => currentModel.value,
)
const { exportAllAngles } = useMultiAngleExport(
  () => renderer.value,
  () => scene.value,
  () => camera.value,
  () => controls.value,
)

function addSceneEnvironment(s: THREE.Scene) {
  // Grid helper
  const grid = new THREE.GridHelper(10, 20, 0x444444, 0x333333)
  grid.position.y = -0.5
  grid.name = '__grid__'
  s.add(grid)

  // Subtle ground plane for grid fade
  const groundGeo = new THREE.PlaneGeometry(10, 10)
  const groundMat = new THREE.MeshBasicMaterial({
    color: store.backgroundColor,
    transparent: true,
    opacity: 0.6,
  })
  const groundPlane = new THREE.Mesh(groundGeo, groundMat)
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.position.y = -0.501
  groundPlane.name = '__ground_fade__'
  s.add(groundPlane)
}

/** Reposition grid, ground fade, and ground shadow to sit beneath the loaded model */
function updateFloorPosition(model: THREE.Object3D) {
  const s = scene.value
  if (!s) return

  const box = new THREE.Box3().setFromObject(model)
  const bottomY = box.min.y - 0.01

  const grid = s.getObjectByName('__grid__')
  if (grid) grid.position.y = bottomY

  const groundFade = s.getObjectByName('__ground_fade__')
  if (groundFade) groundFade.position.y = bottomY - 0.001

  groundShadow.updateGroundPosition(bottomY)
}

// Reposition floor elements whenever a new model is loaded
watch(currentModel, (model) => {
  if (model) updateFloorPosition(model)
})

// Watch background color
watch(
  () => store.backgroundColor,
  (color) => {
    if (scene.value) {
      scene.value.background = new THREE.Color(color)
    }
  },
)

onMounted(() => {
  if (!containerRef.value) return
  init(containerRef.value)

  if (scene.value) {
    // Set initial background
    scene.value.background = new THREE.Color(store.backgroundColor)
    // Add grid + environment
    addSceneEnvironment(scene.value)
  }

  // Initialize sub-systems
  lighting.initialize()
  groundShadow.initialize()
  autoRotateComposable.initialize()
})

defineExpose({
  exportImage,
  exportAllAngles,
  getCanvas,
  cameraPresets,
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<template>
  <BaseModal :is-open="isOpen" title="Batch Product Preview" :closeable="true" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Progress bar -->
      <div v-if="isGenerating" class="space-y-1.5">
        <div class="flex justify-between text-xs text-[var(--text-muted)]">
          <span>Generating previews...</span>
          <span>{{ progress }}%</span>
        </div>
        <div class="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>

      <!-- 3x3 Grid of previews -->
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="item in previews"
          :key="item.modelId"
          :class="[
            'relative rounded-lg overflow-hidden border-2 transition-all duration-fast aspect-square',
            item.modelId === store.activeModelId
              ? 'border-primary shadow-lg shadow-primary/20'
              : 'border-transparent hover:border-primary/30',
          ]"
          :disabled="isGenerating || item.status !== 'done'"
          @click="handleSelect(item.modelId)"
        >
          <!-- Preview image -->
          <img
            v-if="item.imageDataUrl"
            :src="item.imageDataUrl"
            :alt="item.modelName"
            class="w-full h-full object-contain bg-surface-2"
          />
          <!-- Loading state -->
          <div
            v-else
            class="w-full h-full bg-surface-2 flex items-center justify-center"
          >
            <svg
              v-if="item.status === 'rendering'"
              class="w-5 h-5 text-primary animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <svg
              v-else-if="item.status === 'error'"
              class="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div v-else class="w-5 h-5 rounded-full bg-surface-3" />
          </div>
          <!-- Model name label -->
          <div class="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white text-center py-0.5 truncate px-1">
            {{ item.modelName }}
          </div>
        </button>
      </div>
    </div>

    <template #footer>
      <button
        class="flex-1 px-4 py-2 rounded-lg bg-surface-2 text-[var(--text-secondary)] text-sm hover:bg-surface-3 transition-colors"
        @click="$emit('close')"
      >
        Close
      </button>
      <button
        class="flex-1 px-4 py-2 rounded-lg bg-primary/20 text-primary-light text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-40"
        :disabled="isGenerating"
        @click="generate"
      >
        Regenerate
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import BaseModal from '@components/ui/BaseModal.vue'
import { useViewer3dStore } from '../store'
import { BUNDLED_MODELS, MODEL_TEXTURE_DEFAULTS } from '../constants'
import type { BatchPreviewItem } from '../types'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useViewer3dStore()

const previews = ref<BatchPreviewItem[]>(
  BUNDLED_MODELS.map((m) => ({
    modelId: m.id,
    modelName: m.name,
    imageDataUrl: null,
    status: 'pending' as const,
  })),
)
const isGenerating = ref(false)
const progress = ref(0)

function handleSelect(modelId: string) {
  store.selectModel(modelId)
  emit('close')
}

async function generate() {
  if (isGenerating.value) return
  isGenerating.value = true
  progress.value = 0

  // Reset previews
  previews.value = BUNDLED_MODELS.map((m) => ({
    modelId: m.id,
    modelName: m.name,
    imageDataUrl: null,
    status: 'pending' as const,
  }))

  // Create offscreen renderer
  const size = 512
  const offRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  offRenderer.setSize(size, size)
  offRenderer.setPixelRatio(1)
  offRenderer.shadowMap.enabled = true
  offRenderer.setClearColor(new THREE.Color(store.backgroundColor), 1)
  offRenderer.toneMapping = THREE.ACESFilmicToneMapping
  offRenderer.toneMappingExposure = 1.0

  const offCamera = new THREE.PerspectiveCamera(45, 1, 0.01, 100)

  // Load design texture once
  let designTexture: THREE.Texture | null = null
  if (store.textureUrl) {
    const loader = new THREE.TextureLoader()
    try {
      designTexture = await loader.loadAsync(store.textureUrl)
      designTexture.flipY = false
      designTexture.colorSpace = THREE.SRGBColorSpace
    } catch {
      designTexture = null
    }
  }

  const gltfLoader = new GLTFLoader()

  for (let i = 0; i < BUNDLED_MODELS.length; i++) {
    const model = BUNDLED_MODELS[i]
    previews.value[i].status = 'rendering'

    try {
      // Create fresh scene for each model
      const offScene = new THREE.Scene()
      offScene.background = new THREE.Color(store.backgroundColor)

      // Add lighting (simplified studio)
      const ambient = new THREE.AmbientLight(0xffffff, 0.6)
      offScene.add(ambient)
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
      dirLight.position.set(5, 8, 5)
      dirLight.castShadow = true
      offScene.add(dirLight)
      const fillLight = new THREE.DirectionalLight(0xe8e0ff, 0.4)
      fillLight.position.set(-5, 5, -3)
      offScene.add(fillLight)

      // Load model
      const gltf = await gltfLoader.loadAsync(model.url)
      const object = gltf.scene

      // Center and scale
      const box = new THREE.Box3().setFromObject(object)
      const center = box.getCenter(new THREE.Vector3())
      const modelSize = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z)
      const scale = 2 / maxDim
      object.scale.multiplyScalar(scale)
      object.position.sub(center.multiplyScalar(scale))

      // Apply texture if available
      if (designTexture) {
        const defaults = MODEL_TEXTURE_DEFAULTS[model.id]
        object.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return
          const isTarget = model.targetMeshNames.includes(child.name) ||
            (model.targetMaterialNames && child.material &&
              model.targetMaterialNames.includes(
                (child.material as THREE.MeshStandardMaterial).name,
              ))
          if (!isTarget) return

          const mat = (child.material as THREE.MeshStandardMaterial).clone()
          const tex = designTexture!.clone()
          tex.needsUpdate = true
          if (defaults) {
            tex.repeat.set(defaults.maxRepeatX, defaults.flipV ? -defaults.maxRepeatY : defaults.maxRepeatY)
            const oX = (1 - Math.abs(defaults.maxRepeatX)) / 2 + defaults.defaultOffsetX
            const oY = defaults.flipV
              ? (1 + Math.abs(defaults.maxRepeatY)) / 2 + defaults.defaultOffsetY
              : (1 - defaults.maxRepeatY) / 2 + defaults.defaultOffsetY
            tex.offset.set(oX, oY)
          }
          tex.wrapS = THREE.RepeatWrapping
          tex.wrapT = THREE.RepeatWrapping
          mat.map = tex
          mat.needsUpdate = true
          child.material = mat
        })
      }

      offScene.add(object)

      // Fit camera
      const finalBox = new THREE.Box3().setFromObject(object)
      const finalCenter = finalBox.getCenter(new THREE.Vector3())
      const finalSize = finalBox.getSize(new THREE.Vector3())
      const maxFinal = Math.max(finalSize.x, finalSize.y, finalSize.z)
      const fov = offCamera.fov * (Math.PI / 180)
      const dist = maxFinal / (2 * Math.tan(fov / 2)) * 1.3
      offCamera.position.set(
        finalCenter.x + dist * 0.5,
        finalCenter.y + dist * 0.3,
        finalCenter.z + dist,
      )
      offCamera.lookAt(finalCenter)
      offCamera.updateProjectionMatrix()

      // Render
      offRenderer.render(offScene, offCamera)
      const dataUrl = offRenderer.domElement.toDataURL('image/png')
      previews.value[i].imageDataUrl = dataUrl
      previews.value[i].status = 'done'

      // Dispose this model
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose())
          else child.material.dispose()
        }
      })
    } catch {
      previews.value[i].status = 'error'
    }

    progress.value = Math.round(((i + 1) / BUNDLED_MODELS.length) * 100)

    // Yield to keep UI responsive
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }

  // Dispose offscreen renderer and texture
  offRenderer.dispose()
  if (designTexture) designTexture.dispose()

  isGenerating.value = false
}

// Auto-generate when modal opens
watch(() => props.isOpen, (open) => {
  if (open) generate()
})
</script>

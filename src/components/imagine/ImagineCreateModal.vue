<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex flex-col bg-surface-ground"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header (safe-area aware) -->
        <header
          class="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-[var(--border-subtle)] bg-surface-1 pt-safe-t"
        >
          <button
            type="button"
            class="p-2 -m-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-2 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            :class="{ 'opacity-0 pointer-events-none': step === 1 }"
            aria-label="Back"
            @click="goBack"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="flex-1 min-w-0 text-center">
            <h2 class="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
              Create Imagine
            </h2>
            <p class="text-[11px] sm:text-xs text-[var(--text-muted)] truncate">
              Step {{ step }} of 4 · {{ stepLabels[step - 1] }}
            </p>
          </div>
          <button
            type="button"
            class="p-2 -m-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-2 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
            @click="close"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <!-- Stepper -->
        <div class="flex items-center gap-1 px-3 sm:px-4 py-2 border-b border-[var(--border-subtle)] bg-surface-1">
          <template v-for="(label, i) in stepLabels" :key="label">
            <div
              class="flex-1 h-1 rounded-full transition-colors"
              :class="i + 1 <= step ? 'bg-primary' : 'bg-surface-2'"
            />
          </template>
        </div>

        <!-- Body (scrollable, x-overflow guarded) -->
        <main class="flex-1 overflow-y-auto overflow-x-hidden">
          <!-- Step 1: Pick a design -->
          <section v-if="step === 1" class="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6">
            <h3 class="text-sm font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">
              Pick a design
            </h3>

            <div
              v-if="designsStore.isLoading && designsStore.designs.length === 0"
              class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              <SkeletonCard v-for="i in 8" :key="i" />
            </div>

            <div
              v-else-if="designsStore.designs.length === 0"
              class="text-center py-20 text-sm text-[var(--text-muted)]"
            >
              No designs to choose from yet.
            </div>

            <div
              v-else
              class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              <DesignCard
                v-for="design in designsStore.designs"
                :key="design.designId"
                :design="design"
                @select="onPickDesign"
              />
            </div>
          </section>

          <!-- Step 2: Snapshot the 3D mockup -->
          <section v-else-if="step === 2" class="h-full flex flex-col">
            <div class="px-4 py-3 border-b border-[var(--border-subtle)]">
              <h3 class="text-sm font-semibold text-[var(--text-primary)]">
                Pose the 3D mockup
              </h3>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">
                Rotate / zoom to frame it, then capture.
              </p>
            </div>
            <div class="flex-1 min-h-0 p-2">
              <ThreeViewer ref="viewerRef" />
            </div>
          </section>

          <!-- Step 3: Face photo -->
          <section v-else-if="step === 3" class="max-w-2xl mx-auto py-4 sm:py-8 px-4">
            <h3 class="text-sm font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">
              Add a face photo
            </h3>

            <div v-if="facePreviewUrl" class="space-y-3">
              <img
                :src="facePreviewUrl"
                alt="Your photo"
                class="w-full max-h-[60vh] object-contain rounded-lg bg-surface-1"
              />
              <p class="text-xs text-[var(--text-muted)] text-center">
                Looks good? Continue, or retake from the bar below.
              </p>
            </div>

            <div v-else class="space-y-4">
              <div class="rounded-lg border-2 border-dashed border-[var(--border-default)] py-10 sm:py-12 px-6 text-center">
                <svg class="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p class="text-sm text-[var(--text-primary)] font-medium mb-1">
                  Your face is the star
                </p>
                <p class="text-xs text-[var(--text-muted)] mb-4">
                  Use the camera or pick a photo from your gallery.
                </p>
                <button
                  type="button"
                  class="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 min-h-[44px]"
                  :disabled="isCapturingFace"
                  @click="captureFace"
                >
                  {{ isCapturingFace ? 'Opening camera…' : 'Take photo' }}
                </button>
              </div>
              <p v-if="faceError" class="text-xs text-red-400">{{ faceError }}</p>
            </div>
          </section>

          <!-- Step 4: Prompt -->
          <section v-else-if="step === 4" class="max-w-2xl mx-auto py-4 sm:py-8 px-4 space-y-5 sm:space-y-6">
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">
              Describe the scene
            </h3>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <p class="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Mockup</p>
                <img
                  v-if="mockupPreviewUrl"
                  :src="mockupPreviewUrl"
                  alt="Mockup preview"
                  class="w-full aspect-square object-contain rounded-lg bg-surface-1"
                />
              </div>
              <div class="space-y-1">
                <p class="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">You</p>
                <img
                  v-if="facePreviewUrl"
                  :src="facePreviewUrl"
                  alt="Face preview"
                  class="w-full aspect-square object-cover rounded-lg bg-surface-1"
                />
              </div>
            </div>

            <div>
              <label for="imagine-prompt" class="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Prompt
              </label>
              <textarea
                id="imagine-prompt"
                v-model="prompt"
                rows="4"
                placeholder="e.g. wearing this on a runway, dramatic lighting, photorealistic"
                class="w-full px-3 py-2 rounded-lg bg-surface-1 border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary/50 focus:outline-none transition-colors resize-none"
              />
              <p class="mt-1 text-[10px] text-[var(--text-muted)]">
                Tip: keep it short and visual.
              </p>
            </div>
          </section>
        </main>

        <!-- Sticky bottom CTA bar (per step). Step 1 has no bar — picking a card advances. -->
        <footer
          v-if="step > 1"
          class="border-t border-[var(--border-subtle)] bg-surface-1 px-3 sm:px-4 py-3 pb-safe-b"
        >
          <!-- Step 2: Capture mockup -->
          <button
            v-if="step === 2"
            type="button"
            class="w-full px-4 py-3 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 min-h-[48px]"
            :disabled="!canCapture || isCapturing"
            @click="captureMockup"
          >
            {{ isCapturing ? 'Capturing…' : 'Capture & continue' }}
          </button>

          <!-- Step 3: Retake + Continue (only when a photo exists) -->
          <div v-else-if="step === 3 && facePreviewUrl" class="flex gap-2">
            <button
              type="button"
              class="flex-1 px-4 py-3 text-sm font-medium rounded-lg bg-surface-2 text-[var(--text-secondary)] hover:bg-surface-3 transition-colors min-h-[48px]"
              @click="retakeFace"
            >
              Retake
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-3 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors min-h-[48px]"
              @click="step = 4"
            >
              Continue
            </button>
          </div>

          <!-- Step 4: Generate -->
          <button
            v-else-if="step === 4"
            type="button"
            class="w-full px-4 py-3 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 min-h-[48px]"
            :disabled="!canGenerate"
            @click="submit"
          >
            Generate
          </button>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import SkeletonCard from '@components/ui/SkeletonCard.vue'
import DesignCard from '@components/designs/DesignCard.vue'
import { ThreeViewer, useViewer3dStore } from '@modules/viewer3d'
import { useDesignsStore } from '@stores/designs'
import { captureFacePhoto } from '@/services/imagine/captureFace'
import type { DesignListItem } from '@/types/designs'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

const designsStore = useDesignsStore()
const viewerStore = useViewer3dStore()

const stepLabels = ['Pick design', 'Mockup', 'Face photo', 'Prompt']
const step = ref<1 | 2 | 3 | 4>(1)

const selectedDesign = ref<DesignListItem | null>(null)
const mockupBlob = ref<Blob | null>(null)
const mockupPreviewUrl = ref<string | null>(null)
const faceFile = ref<File | null>(null)
const facePreviewUrl = ref<string | null>(null)
const prompt = ref('')

const isCapturing = ref(false)
const isCapturingFace = ref(false)
const faceError = ref<string | null>(null)

const viewerRef = ref<InstanceType<typeof ThreeViewer> | null>(null)

const canCapture = computed(
  () => viewerStore.hasModel && viewerStore.hasDesign && !viewerStore.isModelLoading && !viewerStore.isDesignLoading,
)
const canGenerate = computed(
  () => !!selectedDesign.value && !!mockupBlob.value && !!faceFile.value && prompt.value.trim().length > 0,
)

function reset() {
  step.value = 1
  selectedDesign.value = null
  mockupBlob.value = null
  if (mockupPreviewUrl.value) URL.revokeObjectURL(mockupPreviewUrl.value)
  mockupPreviewUrl.value = null
  faceFile.value = null
  if (facePreviewUrl.value) URL.revokeObjectURL(facePreviewUrl.value)
  facePreviewUrl.value = null
  prompt.value = ''
  faceError.value = null
  viewerStore.reset()
}

function close() {
  reset()
  emit('close')
}

function goBack() {
  if (step.value === 1) return
  step.value = (step.value - 1) as 1 | 2 | 3
  if (step.value === 1) {
    viewerStore.reset()
    selectedDesign.value = null
    mockupBlob.value = null
    if (mockupPreviewUrl.value) URL.revokeObjectURL(mockupPreviewUrl.value)
    mockupPreviewUrl.value = null
  }
}

async function onPickDesign(designId: string) {
  const design = designsStore.designs.find((d) => d.designId === designId)
  if (!design) return
  selectedDesign.value = design
  step.value = 2

  await nextTick()
  const thumbnailUrl = designsStore.getThumbnailUrl(design.thumbnailFilePath)
  if (!thumbnailUrl) return
  viewerStore.reset()
  try {
    await viewerStore.setDesignFromUrl(thumbnailUrl)
  } catch {
    // Texture mapper still handles its own load; the viewer will render regardless.
  }
}

async function captureMockup() {
  if (!viewerRef.value) return
  isCapturing.value = true
  try {
    const blob = await viewerRef.value.captureBlob({ width: 1024, height: 1024, transparent: false })
    if (!blob) return
    mockupBlob.value = blob
    if (mockupPreviewUrl.value) URL.revokeObjectURL(mockupPreviewUrl.value)
    mockupPreviewUrl.value = URL.createObjectURL(blob)
    step.value = 3
  } finally {
    isCapturing.value = false
  }
}

async function captureFace() {
  faceError.value = null
  isCapturingFace.value = true
  try {
    const captured = await captureFacePhoto()
    if (!captured) return
    faceFile.value = captured.file
    if (facePreviewUrl.value) URL.revokeObjectURL(facePreviewUrl.value)
    facePreviewUrl.value = captured.previewUrl
  } catch (e) {
    faceError.value = e instanceof Error ? e.message : 'Failed to capture photo'
  } finally {
    isCapturingFace.value = false
  }
}

function retakeFace() {
  if (facePreviewUrl.value) URL.revokeObjectURL(facePreviewUrl.value)
  facePreviewUrl.value = null
  faceFile.value = null
}

function submit() {
  if (!canGenerate.value) return
  // Step 3 wires this up to a real backend; for now just log the payload shape.
  // eslint-disable-next-line no-console
  console.log('Imagine submit', {
    designId: selectedDesign.value!.designId,
    mockupImageBlob: mockupBlob.value,
    faceImageBlob: faceFile.value,
    prompt: prompt.value.trim(),
  })
  close()
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) reset()
  },
)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

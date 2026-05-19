<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex flex-col bg-surface-ground"
        role="dialog"
        aria-modal="true"
        :aria-busy="isGenerating"
      >
        <!-- Header (safe-area aware) -->
        <header
          class="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-[var(--border-subtle)] bg-surface-1 pt-safe-t"
        >
          <button
            type="button"
            class="p-2 -m-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-2 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            :class="{ 'opacity-0 pointer-events-none': step === 1 || !!resultUrl || isGenerating }"
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
              v-else-if="imagineDesigns.length === 0"
              class="text-center py-20 px-4 text-sm text-[var(--text-muted)] leading-relaxed"
            >
              <p class="text-[var(--text-primary)] font-medium mb-1">
                No designs with artwork yet
              </p>
              <p>
                Imagine needs a design that has artwork on it. Open a design in
                the editor and add something to it, then come back.
              </p>
            </div>

            <div
              v-else
              class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              <DesignCard
                v-for="design in imagineDesigns"
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
                <template v-if="isGarmentRoute">
                  Pick a product, then rotate to a flat front view and zoom in so the design fills the frame.
                </template>
                <template v-else>
                  Pick a product, rotate / zoom to frame it, then capture.
                </template>
              </p>
            </div>

            <!-- Product picker -->
            <div class="px-3 py-2 border-b border-[var(--border-subtle)] bg-surface-1">
              <div class="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-thin">
                <button
                  v-for="model in pickerModels"
                  :key="model.id"
                  type="button"
                  class="flex-shrink-0 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap min-h-[40px] transition-colors"
                  :class="
                    model.id === viewerStore.activeModelId
                      ? 'bg-primary text-white'
                      : 'bg-surface-2 text-[var(--text-secondary)] hover:bg-surface-3'
                  "
                  :disabled="viewerStore.isModelLoading"
                  @click="pickModel(model.id)"
                >
                  {{ model.name }}
                </button>
              </div>
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
              <div
                v-if="isGarmentRoute"
                class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200 leading-relaxed"
              >
                <span class="font-semibold">Is your chest visible?</span>
                The design only appears where the AI can see your torso. If your
                photo is head-only, the result will have a blank or empty shirt.
                If it's cropped tight, tap <span class="font-semibold">Retake</span>
                and step further back.
              </div>
              <p v-else class="text-xs text-[var(--text-muted)] text-center">
                Looks good? Continue, or retake from the bar below.
              </p>
            </div>

            <div v-else class="space-y-4">
              <div class="rounded-lg border-2 border-dashed border-[var(--border-default)] py-8 sm:py-10 px-6 text-center">
                <!-- Garment route: silhouette guide showing the framing IDM-VTON needs -->
                <svg
                  v-if="isGarmentRoute"
                  class="w-20 h-24 text-[var(--text-muted)] mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 80 96"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="76" height="92" rx="6" stroke-width="1.5" stroke-dasharray="3 3" class="text-primary/50" stroke="currentColor" />
                  <circle cx="40" cy="26" r="11" stroke-width="2" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M18 60 Q40 44 62 60 L62 86 L18 86 Z" class="text-primary" stroke="currentColor" />
                </svg>
                <!-- Non-garment route: simple camera icon -->
                <svg
                  v-else
                  class="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p class="text-sm text-[var(--text-primary)] font-medium mb-1">
                  <template v-if="isGarmentRoute">Frame head + chest</template>
                  <template v-else>Take a selfie</template>
                </p>
                <p class="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                  <template v-if="isGarmentRoute">
                    Step back so your <span class="text-[var(--text-primary)] font-medium">head, shoulders, and chest</span>
                    are all in frame. Your real face is preserved exactly — but
                    the design only shows on the visible chest area. Close-ups
                    of just your face produce a blank shirt.
                  </template>
                  <template v-else>
                    Use the camera or pick a photo from your gallery.
                  </template>
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

          <!-- Step 4: Review & generate -->
          <section v-else-if="step === 4 && !resultUrl" class="max-w-2xl mx-auto py-4 sm:py-8 px-4 space-y-5 sm:space-y-6">
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">
              Ready to generate
            </h3>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <p class="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Mockup</p>
                  <button
                    type="button"
                    class="text-[10px] uppercase tracking-wider text-primary hover:text-primary-dark font-medium min-h-[24px] px-1"
                    :disabled="isGenerating"
                    @click="editMockup"
                  >
                    Change
                  </button>
                </div>
                <img
                  v-if="mockupPreviewUrl"
                  :src="mockupPreviewUrl"
                  alt="Mockup preview"
                  class="w-full aspect-square object-contain rounded-lg bg-surface-1"
                />
              </div>
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <p class="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">You</p>
                  <button
                    type="button"
                    class="text-[10px] uppercase tracking-wider text-primary hover:text-primary-dark font-medium min-h-[24px] px-1"
                    :disabled="isGenerating"
                    @click="editFace"
                  >
                    Retake
                  </button>
                </div>
                <img
                  v-if="facePreviewUrl"
                  :src="facePreviewUrl"
                  alt="Face preview"
                  class="w-full aspect-square object-cover rounded-lg bg-surface-1"
                />
              </div>
            </div>

            <div class="rounded-lg border border-[var(--border-subtle)] bg-surface-1 px-4 py-3">
              <p v-if="isGarmentRoute" class="text-xs text-[var(--text-secondary)] leading-relaxed">
                We'll put the
                <span class="text-[var(--text-primary)] font-medium">{{ productLabelText }}</span>
                with your printed design on
                <span class="text-[var(--text-primary)] font-medium">you</span>.
                Your real face and body are preserved exactly — the design
                appears on the visible chest area of your photo.
              </p>
              <p v-else class="text-xs text-[var(--text-secondary)] leading-relaxed">
                We'll generate a photo of
                <span class="text-[var(--text-primary)] font-medium">you</span> with a
                <span class="text-[var(--text-primary)] font-medium">{{ productLabelText }}</span>.
                Your face and the product are preserved.
                <span class="text-[var(--text-muted)]">
                  The design on the {{ productLabelText }} will be reimagined as a similar
                  graphic — for non-apparel products this AI route can't read your mockup
                  pixel-by-pixel.
                </span>
              </p>
            </div>

            <p v-if="generationError" class="text-xs text-red-400 break-words">
              {{ generationError }}
            </p>
          </section>

          <!-- Result view -->
          <section
            v-else-if="step === 4 && resultUrl"
            class="max-w-2xl mx-auto py-4 sm:py-8 px-4 space-y-4"
          >
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">
              Here's your imagine
            </h3>
            <img
              :src="resultUrl"
              alt="Generated image"
              class="w-full max-h-[70vh] object-contain rounded-lg bg-surface-1"
            />
            <p class="text-xs text-[var(--text-muted)] text-center">
              Tap "Start over" to make another, or close to come back later.
            </p>
          </section>
        </main>

        <!-- Generating overlay -->
        <div
          v-if="isGenerating"
          class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-ground/85 backdrop-blur-sm"
          aria-live="polite"
        >
          <div class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p class="text-sm text-[var(--text-primary)] font-medium px-6 text-center">
            Generating your imagine…
          </p>
          <p class="text-xs text-[var(--text-muted)] px-6 text-center">
            This usually takes 20–60 seconds.
          </p>
        </div>

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
            v-else-if="step === 4 && !resultUrl"
            type="button"
            class="w-full px-4 py-3 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 min-h-[48px]"
            :disabled="!canGenerate || isGenerating"
            @click="submit"
          >
            {{ isGenerating ? 'Generating…' : 'Generate' }}
          </button>

          <!-- Result: Start over + Close -->
          <div v-else-if="step === 4 && resultUrl" class="flex gap-2">
            <button
              type="button"
              class="flex-1 px-4 py-3 text-sm font-medium rounded-lg bg-surface-2 text-[var(--text-secondary)] hover:bg-surface-3 transition-colors min-h-[48px]"
              @click="startOver"
            >
              Start over
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-3 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors min-h-[48px]"
              @click="close"
            >
              Done
            </button>
          </div>
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
import { generateImage } from '@/services/imagine/replicateClient'
import { productLabel, modelKind } from '@/services/imagine/promptBuilder'
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

const isCapturing = ref(false)
const isCapturingFace = ref(false)
const faceError = ref<string | null>(null)
const isGenerating = ref(false)
const generationError = ref<string | null>(null)
const resultUrl = ref<string | null>(null)

const viewerRef = ref<InstanceType<typeof ThreeViewer> | null>(null)

const canCapture = computed(
  () => viewerStore.hasModel && viewerStore.hasDesign && !viewerStore.isModelLoading && !viewerStore.isDesignLoading,
)
const canGenerate = computed(
  () => !!selectedDesign.value && !!mockupBlob.value && !!faceFile.value && !!viewerStore.activeModelId,
)
const productLabelText = computed(() => productLabel(viewerStore.activeModelId))
const isGarmentRoute = computed(() => modelKind(viewerStore.activeModelId) === 'garment')

const pickerModels = computed(() =>
  viewerStore.allModels.filter((m) => m.bundled && !m.hidden),
)

// Imagine can only do something useful with a design that has actual artwork
// on it — designs with `thumbnailFilePath === null` render the default
// placeholder in the editor and are blank canvases. Hide them here so the user
// doesn't pick one and burn credits generating a person holding a blank tee.
const imagineDesigns = computed(() =>
  designsStore.designs.filter((d) => !!d.thumbnailFilePath),
)

function pickModel(id: string) {
  if (id === viewerStore.activeModelId || viewerStore.isModelLoading) return
  viewerStore.selectModel(id)
}

function reset() {
  step.value = 1
  selectedDesign.value = null
  mockupBlob.value = null
  if (mockupPreviewUrl.value) URL.revokeObjectURL(mockupPreviewUrl.value)
  mockupPreviewUrl.value = null
  faceFile.value = null
  if (facePreviewUrl.value) URL.revokeObjectURL(facePreviewUrl.value)
  facePreviewUrl.value = null
  faceError.value = null
  generationError.value = null
  resultUrl.value = null
  isGenerating.value = false
  viewerStore.reset()
}

function startOver() {
  reset()
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
    const blob = await viewerRef.value.captureBlob({
      width: 1024,
      height: 1024,
      transparent: false,
      cleanBackground: true,
      // For garments only: auto-zoom to the print area so IDM-VTON sees
      // the design at high pixel density instead of a thumbnail-sized chest
      // patch. Non-garment products keep the user's framing.
      framePrintArea: isGarmentRoute.value,
    })
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

// Step 4 → Step 2: keep selected design + face, drop mockup so user re-poses
// (and can change the product via the chip strip at the top of Step 2).
function editMockup() {
  if (isGenerating.value) return
  mockupBlob.value = null
  if (mockupPreviewUrl.value) URL.revokeObjectURL(mockupPreviewUrl.value)
  mockupPreviewUrl.value = null
  generationError.value = null
  step.value = 2
}

// Step 4 → Step 3: keep mockup + design, drop face so user can retake.
function editFace() {
  if (isGenerating.value) return
  retakeFace()
  generationError.value = null
  step.value = 3
}

async function submit() {
  if (!canGenerate.value || isGenerating.value) return
  generationError.value = null
  isGenerating.value = true
  try {
    const url = await generateImage({
      modelId: viewerStore.activeModelId,
      mockupImage: mockupBlob.value!,
      faceImage: faceFile.value!,
    })
    resultUrl.value = url
  } catch (e) {
    generationError.value = e instanceof Error ? e.message : 'Generation failed.'
  } finally {
    isGenerating.value = false
  }
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

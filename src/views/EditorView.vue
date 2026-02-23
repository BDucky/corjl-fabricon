<template>
  <div class="flex flex-col h-screen bg-surface-ground">
    <!-- Teal toolbar -->
    <div class="flex items-center justify-between px-4 py-2.5 bg-primary border-b border-primary-dark">
      <div class="flex items-center gap-4">
        <RouterLink
          to="/projects"
          class="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Projects
        </RouterLink>
        <h1 class="text-base font-semibold text-white font-rubik">
          Project Editor
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- 2D/3D toggle -->
        <div class="flex bg-primary-dark rounded-full p-0.5">
          <button
            :class="[
              'px-3 py-1 text-xs font-medium rounded-full transition-all duration-normal',
              viewMode === '2d' ? 'bg-white text-primary-dark' : 'text-white/60 hover:text-white',
            ]"
            @click="viewMode = '2d'"
          >
            2D
          </button>
          <button
            :class="[
              'px-3 py-1 text-xs font-medium rounded-full transition-all duration-normal',
              viewMode === '3d' ? 'bg-white text-primary-dark' : 'text-white/60 hover:text-white',
            ]"
            @click="viewMode = '3d'"
          >
            3D
          </button>
        </div>

        <BaseButton size="sm" variant="accent" @click="saveProject">
          Save
        </BaseButton>
        <BaseButton size="sm" variant="ghost" @click="handleExport">
          Export
        </BaseButton>
      </div>
    </div>

    <!-- Editor content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left sidebar -->
      <Transition name="panel-slide-left">
        <div
          v-if="showLayers"
          class="w-56 bg-surface-1/95 backdrop-blur-sm border-r border-[var(--border-subtle)] overflow-y-auto"
        >
          <!-- 3D: Model library -->
          <ModelLibraryPanel v-if="viewMode === '3d'" />

          <!-- 2D: Layers -->
          <div v-else class="p-4">
            <h2 class="text-xs font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wider">
              Layers
            </h2>
            <div class="space-y-1">
              <div
                v-for="(layer, i) in layers"
                :key="i"
                :class="[
                  'px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors duration-fast',
                  activeLayer === i
                    ? 'bg-primary/20 text-primary-light border border-primary/30'
                    : 'text-[var(--text-secondary)] hover:bg-surface-2',
                ]"
                @click="activeLayer = i"
              >
                {{ layer }}
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Main canvas area -->
      <div class="flex-1 flex flex-col bg-surface-ground">
        <!-- Canvas toolbar -->
        <div class="flex items-center justify-between px-3 py-1.5 bg-surface-0 border-b border-[var(--border-subtle)]">
          <div class="flex items-center gap-1">
            <button
              class="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-1 transition-colors"
              title="Toggle Layers (L)"
              @click="showLayers = !showLayers"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
            <button
              class="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-1 transition-colors"
              title="Toggle Properties (P)"
              @click="showProperties = !showProperties"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>

          <!-- 3D toolbar controls -->
          <ViewerToolbar v-if="viewMode === '3d'" @export="showExportDialog = true" />
        </div>

        <!-- Canvas -->
        <Transition :name="viewMode === '3d' ? 'viewport-transition' : 'viewport-transition'" mode="out-in">
          <div
            v-if="viewMode === '2d'"
            key="2d"
            class="flex-1 flex items-center justify-center p-4"
          >
            <div class="bg-white rounded-lg shadow-depth-lg w-full max-w-2xl aspect-[4/3] flex items-center justify-center">
              <p class="text-gray-400 text-sm">2D Canvas (Phase 2)</p>
            </div>
          </div>
          <div
            v-else
            key="3d"
            class="flex-1 p-2"
          >
            <ThreeViewer ref="threeViewerRef" />
          </div>
        </Transition>
      </div>

      <!-- Right panel -->
      <Transition name="panel-slide-right">
        <div
          v-if="showProperties"
          class="w-60 bg-surface-1/95 backdrop-blur-sm border-l border-[var(--border-subtle)] overflow-y-auto"
        >
          <!-- 3D: Viewer properties -->
          <ViewerPropertiesPanel v-if="viewMode === '3d'" />

          <!-- 2D: Object properties -->
          <div v-else class="p-4">
            <h2 class="text-xs font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wider">
              Properties
            </h2>
            <div class="space-y-4">
              <div>
                <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
                  Opacity
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  class="w-full accent-primary"
                />
              </div>
              <div>
                <label class="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
                  Rotation
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  class="w-full accent-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Export dialog -->
    <ExportDialog
      :is-open="showExportDialog"
      @close="showExportDialog = false"
      @confirm="doExport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import BaseButton from '@components/ui/BaseButton.vue'
import {
  ThreeViewer,
  ModelLibraryPanel,
  ViewerPropertiesPanel,
  ViewerToolbar,
  ExportDialog,
} from '@modules/viewer3d'

const route = useRoute()
const projectId = route.params.projectId as string

const viewMode = ref<'2d' | '3d'>('2d')
const showLayers = ref(true)
const showProperties = ref(true)
const activeLayer = ref(0)
const showExportDialog = ref(false)
const threeViewerRef = ref<InstanceType<typeof ThreeViewer> | null>(null)

const layers = ['Background', 'Text Layer', 'Image Layer']

const saveProject = () => {
  console.log('Saving project:', projectId)
}

const handleExport = () => {
  if (viewMode.value === '3d') {
    showExportDialog.value = true
  } else {
    console.log('Exporting 2D project:', projectId)
  }
}

const doExport = () => {
  showExportDialog.value = false
  threeViewerRef.value?.exportImage()
}
</script>

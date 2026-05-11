<template>
  <div class="flex flex-col h-screen bg-surface-ground">
    <!-- Teal toolbar -->
    <div class="flex items-center justify-between px-4 py-2.5 bg-primary border-b border-primary-dark">
      <div class="flex items-center gap-4">
        <RouterLink
          to="/designs"
          class="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          My Designs
        </RouterLink>
        <h1 class="text-base font-semibold text-white font-rubik">
          Fabricon 3D Preview
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton size="sm" variant="ghost" @click="showExportDialog = true">
          Export
        </BaseButton>
      </div>
    </div>

    <!-- Editor content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left sidebar: Design Input -->
      <Transition name="panel-slide-left">
        <div
          v-if="showLeftPanel"
          class="w-60 bg-surface-1/95 backdrop-blur-sm border-r border-[var(--border-subtle)] overflow-y-auto"
        >
          <DesignInputPanel />
        </div>
      </Transition>

      <!-- Main canvas area -->
      <div class="flex-1 flex flex-col bg-surface-ground">
        <!-- Canvas toolbar -->
        <div class="flex items-center justify-between px-3 py-1.5 bg-surface-0 border-b border-[var(--border-subtle)]">
          <div class="flex items-center gap-1">
            <button
              class="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-1 transition-colors"
              title="Toggle Design Panel (L)"
              @click="showLeftPanel = !showLeftPanel"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
            <button
              class="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-1 transition-colors"
              title="Toggle Properties (P)"
              @click="showRightPanel = !showRightPanel"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>

          <!-- 3D toolbar controls -->
          <ViewerToolbar
            @export="showExportDialog = true"
            @batch-preview="showBatchPreview = true"
          />
        </div>

        <!-- 3D Canvas -->
        <div class="flex-1 p-2">
          <ThreeViewer ref="threeViewerRef" />
        </div>
      </div>

      <!-- Right panel: Properties -->
      <Transition name="panel-slide-right">
        <div
          v-if="showRightPanel"
          class="w-60 bg-surface-1/95 backdrop-blur-sm border-l border-[var(--border-subtle)] overflow-y-auto"
        >
          <ViewerPropertiesPanel />
        </div>
      </Transition>
    </div>

    <!-- Export dialog -->
    <ExportDialog
      :is-open="showExportDialog"
      @close="showExportDialog = false"
      @confirm="doExport"
      @export-all-angles="doExportAllAngles"
      @export-turntable-gif="doExportTurntableGif"
    />

    <!-- Batch preview modal -->
    <BatchPreviewModal
      :is-open="showBatchPreview"
      @close="showBatchPreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@components/ui/BaseButton.vue'
import {
  ThreeViewer,
  DesignInputPanel,
  ViewerPropertiesPanel,
  ViewerToolbar,
  ExportDialog,
  BatchPreviewModal,
} from '@modules/viewer3d'
import { useURLParams } from '@modules/viewer3d/composables/useURLParams'

const showLeftPanel = ref(true)
const showRightPanel = ref(true)
const showExportDialog = ref(false)
const showBatchPreview = ref(false)
const threeViewerRef = ref<InstanceType<typeof ThreeViewer> | null>(null)

// Initialize URL params integration
useURLParams()

const doExport = () => {
  showExportDialog.value = false
  threeViewerRef.value?.exportImage()
}

const doExportAllAngles = () => {
  showExportDialog.value = false
  threeViewerRef.value?.exportAllAngles()
}

const doExportTurntableGif = () => {
  showExportDialog.value = false
  threeViewerRef.value?.exportTurntableGif()
}
</script>

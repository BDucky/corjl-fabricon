<template>
  <div class="flex flex-col h-[100dvh] bg-surface-ground">
    <!-- Teal top bar -->
    <div
      class="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 bg-primary border-b border-primary-dark pt-safe-t"
    >
      <RouterLink
        to="/designs"
        class="flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-medium min-w-0"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="hidden sm:inline">My Designs</span>
      </RouterLink>
      <h1
        class="flex-1 text-center text-sm sm:text-base font-semibold text-white font-rubik truncate"
      >
        3D Preview
      </h1>
      <BaseButton size="sm" variant="ghost" @click="showExportDialog = true">
        Export
      </BaseButton>
    </div>

    <!-- Main editor area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Desktop left sidebar -->
      <Transition name="panel-slide-left">
        <div
          v-if="showLeftPanel"
          class="hidden md:block w-60 bg-surface-1/95 backdrop-blur-sm border-r border-[var(--border-subtle)] overflow-y-auto"
        >
          <DesignInputPanel />
        </div>
      </Transition>

      <!-- Center canvas column -->
      <div class="flex-1 flex flex-col bg-surface-ground min-w-0">
        <!-- Desktop canvas toolbar (hidden on phone) -->
        <div
          class="hidden md:flex items-center justify-between px-3 py-1.5 bg-surface-0 border-b border-[var(--border-subtle)]"
        >
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
          <ViewerToolbar
            @export="showExportDialog = true"
            @batch-preview="showBatchPreview = true"
          />
        </div>

        <!-- 3D canvas -->
        <div class="flex-1 p-1 sm:p-2 min-h-0">
          <ThreeViewer ref="threeViewerRef" />
        </div>
      </div>

      <!-- Desktop right sidebar -->
      <Transition name="panel-slide-right">
        <div
          v-if="showRightPanel"
          class="hidden md:block w-60 bg-surface-1/95 backdrop-blur-sm border-l border-[var(--border-subtle)] overflow-y-auto"
        >
          <ViewerPropertiesPanel />
        </div>
      </Transition>
    </div>

    <!-- Phone bottom action bar -->
    <div
      class="md:hidden flex items-stretch border-t border-[var(--border-subtle)] bg-surface-1 pb-safe-b"
    >
      <button
        type="button"
        class="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[var(--text-secondary)] active:bg-surface-2 transition-colors min-h-[56px]"
        :class="{ 'text-primary-light': mobileSheet === 'design' }"
        @click="openSheet('design')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="text-[11px] font-medium">Design</span>
      </button>
      <button
        type="button"
        class="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[var(--text-secondary)] active:bg-surface-2 transition-colors min-h-[56px]"
        :class="{ 'text-primary-light': mobileSheet === 'properties' }"
        @click="openSheet('properties')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span class="text-[11px] font-medium">Properties</span>
      </button>
      <button
        type="button"
        class="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[var(--text-secondary)] active:bg-surface-2 transition-colors min-h-[56px]"
        :class="{ 'text-primary-light': mobileSheet === 'tools' }"
        @click="openSheet('tools')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-[11px] font-medium">Tools</span>
      </button>
    </div>

    <!-- Phone sheets -->
    <MobileBottomSheet
      :is-open="mobileSheet === 'design'"
      title="Design"
      max-height="85vh"
      @close="mobileSheet = null"
    >
      <DesignInputPanel />
    </MobileBottomSheet>

    <MobileBottomSheet
      :is-open="mobileSheet === 'properties'"
      title="Properties"
      max-height="85vh"
      @close="mobileSheet = null"
    >
      <ViewerPropertiesPanel />
    </MobileBottomSheet>

    <MobileBottomSheet
      :is-open="mobileSheet === 'tools'"
      title="Tools"
      max-height="auto"
      @close="mobileSheet = null"
    >
      <div class="px-4 py-2 grid grid-cols-2 gap-2">
        <button
          v-for="tool in toolButtons"
          :key="tool.id"
          type="button"
          class="flex items-center gap-3 px-3 py-3 rounded-lg bg-surface-2 active:bg-surface-3 transition-colors text-left min-h-[56px]"
          :class="tool.active ? 'ring-1 ring-primary-light' : ''"
          @click="tool.onClick()"
        >
          <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[var(--text-secondary)]">
            <component :is="tool.icon" />
          </span>
          <span class="text-sm font-medium text-[var(--text-primary)]">{{ tool.label }}</span>
        </button>
      </div>
    </MobileBottomSheet>

    <!-- Export dialog -->
    <ExportDialog
      :is-open="showExportDialog"
      @close="showExportDialog = false"
      @confirm="doExport"
      @export-all-angles="doExportAllAngles"
      @export-turntable-gif="doExportTurntableGif"
    />

    <!-- Batch preview -->
    <BatchPreviewModal
      :is-open="showBatchPreview"
      @close="showBatchPreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch } from 'vue'
import BaseButton from '@components/ui/BaseButton.vue'
import MobileBottomSheet from '@components/ui/MobileBottomSheet.vue'
import {
  ThreeViewer,
  DesignInputPanel,
  ViewerPropertiesPanel,
  ViewerToolbar,
  ExportDialog,
  BatchPreviewModal,
  useViewer3dStore,
} from '@modules/viewer3d'
import { useURLParams } from '@modules/viewer3d/composables/useURLParams'

const showLeftPanel = ref(true)
const showRightPanel = ref(true)
const showExportDialog = ref(false)
const showBatchPreview = ref(false)
const mobileSheet = ref<'design' | 'properties' | 'tools' | null>(null)
const threeViewerRef = ref<InstanceType<typeof ThreeViewer> | null>(null)
const viewerStore = useViewer3dStore()

useURLParams()

function openSheet(id: 'design' | 'properties' | 'tools') {
  mobileSheet.value = mobileSheet.value === id ? null : id
}

// When the user switches products from inside a sheet, close the sheet so
// the new model is immediately visible on the canvas.
watch(
  () => viewerStore.activeModelId,
  (next, prev) => {
    if (next && next !== prev && mobileSheet.value) {
      mobileSheet.value = null
    }
  },
)

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

// Phone "Tools" sheet — mirrors desktop ViewerToolbar one-tap actions.
const RotateIcon = () =>
  h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    }),
  ])
const ShadowIcon = () =>
  h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2',
    }),
  ])
const PrintAreaIcon = () =>
  h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-dasharray': '3 2' }, [
    h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 1, 'stroke-width': 2 }),
  ])
const BatchIcon = () =>
  h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    }),
  ])

const toolButtons = computed(() => [
  {
    id: 'autoRotate',
    label: 'Auto-rotate',
    icon: RotateIcon,
    active: viewerStore.autoRotate,
    onClick: () => viewerStore.toggleAutoRotate(),
  },
  {
    id: 'shadow',
    label: 'Ground shadow',
    icon: ShadowIcon,
    active: viewerStore.showGroundShadow,
    onClick: () => viewerStore.toggleGroundShadow(),
  },
  {
    id: 'printArea',
    label: 'Print area',
    icon: PrintAreaIcon,
    active: viewerStore.showPrintArea,
    onClick: () => viewerStore.togglePrintArea(),
  },
  {
    id: 'batchPreview',
    label: 'Batch preview',
    icon: BatchIcon,
    active: false,
    onClick: () => {
      mobileSheet.value = null
      showBatchPreview.value = true
    },
  },
])
</script>

<style scoped>
.panel-slide-left-enter-active,
.panel-slide-left-leave-active,
.panel-slide-right-enter-active,
.panel-slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.panel-slide-left-enter-from,
.panel-slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.panel-slide-right-enter-from,
.panel-slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

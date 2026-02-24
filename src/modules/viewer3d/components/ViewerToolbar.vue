<template>
  <div class="flex items-center gap-1">
    <!-- Auto-rotate -->
    <button
      :class="[
        'p-1.5 rounded-lg transition-colors',
        store.autoRotate
          ? 'text-primary-light bg-primary/20'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-1',
      ]"
      title="Auto-rotate (R)"
      @click="store.toggleAutoRotate()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>

    <!-- Ground shadow -->
    <button
      :class="[
        'p-1.5 rounded-lg transition-colors',
        store.showGroundShadow
          ? 'text-primary-light bg-primary/20'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-1',
      ]"
      title="Ground shadow (G)"
      @click="store.toggleGroundShadow()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
      </svg>
    </button>

    <!-- Print area overlay -->
    <button
      :class="[
        'p-1.5 rounded-lg transition-colors',
        store.showPrintArea
          ? 'text-primary-light bg-primary/20'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-1',
      ]"
      title="Print area (A)"
      @click="store.togglePrintArea()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-dasharray="3 2">
        <rect x="3" y="3" width="18" height="18" rx="1" stroke-width="2" />
      </svg>
    </button>

    <div class="w-px h-4 bg-[var(--border-subtle)] mx-1" />

    <!-- Export -->
    <button
      class="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-1 transition-colors"
      title="Export PNG"
      @click="$emit('export')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </button>

    <!-- Batch preview -->
    <button
      class="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-surface-1 transition-colors"
      title="Batch Preview"
      @click="$emit('batchPreview')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useViewer3dStore } from '../store'

const store = useViewer3dStore()

defineEmits<{
  export: []
  batchPreview: []
}>()
</script>

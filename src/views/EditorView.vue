<template>
  <div class="flex flex-col h-screen bg-editor-bg">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-editor-panel border-b border-editor-border">
      <div class="flex items-center gap-4">
        <RouterLink to="/projects" class="text-blue-500 hover:text-blue-400">
          ← Projects
        </RouterLink>
        <h1 class="text-xl font-semibold text-editor-text">
          Project Editor
        </h1>
      </div>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          @click="saveProject"
        >
          Save (Ctrl+S)
        </button>
        <button
          class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          @click="exportProject"
        >
          Export
        </button>
      </div>
    </div>

    <!-- Editor content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <div class="w-64 bg-editor-panel border-r border-editor-border overflow-y-auto">
        <div class="p-4">
          <h2 class="text-sm font-semibold text-editor-text mb-4 uppercase tracking-wide">
            Layers
          </h2>
          <div class="space-y-2">
            <div class="p-2 bg-blue-900 text-white rounded text-sm cursor-pointer">
              Background
            </div>
            <div class="p-2 hover:bg-editor-border rounded text-sm cursor-pointer text-editor-text">
              Text Layer
            </div>
          </div>
        </div>
      </div>

      <!-- Main canvas area -->
      <div class="flex-1 flex gap-2 p-2 bg-editor-bg">
        <div class="flex-1 bg-white rounded border border-editor-border flex items-center justify-center">
          <p class="text-gray-400">
            2D Canvas (Phase 2)
          </p>
        </div>
      </div>

      <!-- Properties panel -->
      <div class="w-64 bg-editor-panel border-l border-editor-border overflow-y-auto">
        <div class="p-4">
          <h2 class="text-sm font-semibold text-editor-text mb-4 uppercase tracking-wide">
            Properties
          </h2>
          <div class="space-y-4">
            <div>
              <label class="text-xs text-editor-text uppercase tracking-wide">
                Opacity
              </label>
              <input
                type="range"
                min="0"
                max="100"
                class="w-full mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = route.params.projectId as string

const saveProject = () => {
  console.log('Saving project:', projectId)
}

const exportProject = () => {
  console.log('Exporting project:', projectId)
}
</script>

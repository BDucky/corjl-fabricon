<template>
  <div class="bg-surface-1 border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden">
    <!-- Thumbnail skeleton -->
    <div class="skeleton h-44 w-full rounded-none" />
    <!-- Content skeleton -->
    <div class="p-4 space-y-3">
      <div class="skeleton h-4 w-3/4" />
      <div class="skeleton h-3 w-1/2" />
      <div class="skeleton h-9 w-full mt-4 rounded-full" />
    </div>
  </div>
</template>

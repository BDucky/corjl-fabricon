<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="(route.meta.transition as string) || 'page-fade'" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>

<script setup lang="ts">
// Auth initialization is handled in main.ts before app mount.
// No additional setup needed here.
</script>

<template>
  <div class="flex items-center justify-center" :style="{ perspective: '200px' }">
    <div class="loader-cube">
      <div class="loader-cube__face loader-cube__face--front" />
      <div class="loader-cube__face loader-cube__face--back" />
      <div class="loader-cube__face loader-cube__face--right" />
      <div class="loader-cube__face loader-cube__face--left" />
      <div class="loader-cube__face loader-cube__face--top" />
      <div class="loader-cube__face loader-cube__face--bottom" />
    </div>
  </div>
</template>

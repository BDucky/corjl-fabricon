<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto py-6 px-4 sm:py-8 sm:px-6">
      <header class="mb-6">
        <h1 class="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-rubik">Settings</h1>
        <p class="text-sm text-[var(--text-muted)] mt-1">Signed in as {{ authStore.userEmail || '—' }}</p>
      </header>

      <!-- Sign-in section -->
      <section class="space-y-3">
        <h2 class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Sign in
        </h2>

        <div class="rounded-xl bg-surface-1 border border-[var(--border-subtle)] p-4 sm:p-5">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/15 text-primary-light flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M9 11V7a3 3 0 016 0v4M5 11h14a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8a1 1 0 011-1z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-[var(--text-primary)]">
                Sign in with {{ biometricLabel }}
              </p>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">
                {{ statusText }}
              </p>
            </div>
            <label
              class="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5"
              :class="{ 'opacity-40 cursor-not-allowed': !canToggle || isBusy }"
            >
              <input
                type="checkbox"
                class="sr-only peer"
                :checked="authStore.isBiometricEnabled"
                :disabled="!canToggle || isBusy"
                @change="onToggle"
              />
              <div class="w-10 h-6 bg-surface-3 rounded-full peer peer-checked:bg-primary transition-colors" />
              <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
            </label>
          </div>

          <p v-if="message" class="mt-3 text-xs" :class="messageOk ? 'text-primary-light' : 'text-red-400'">
            {{ message }}
          </p>
        </div>
      </section>

      <!-- Account section -->
      <section class="mt-8 space-y-3">
        <h2 class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Account
        </h2>
        <button
          type="button"
          class="w-full text-left rounded-xl bg-surface-1 border border-[var(--border-subtle)] p-4 sm:p-5 hover:bg-surface-2 transition-colors active:bg-surface-2"
          @click="onSignOut"
        >
          <p class="text-sm font-medium text-red-400">Sign out</p>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">
            Ends this session on this device.
          </p>
        </button>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@components/layout/AppLayout.vue'
import { useAuthStore } from '@stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isBusy = ref(false)
const message = ref<string | null>(null)
const messageOk = ref(false)

const biometricLabel = computed(() => authStore.biometricAvailability.label ?? 'biometrics')

const canToggle = computed(() => authStore.biometricAvailability.isAvailable)

const statusText = computed(() => {
  if (!authStore.biometricAvailability.isAvailable) {
    return authStore.biometricAvailability.reason || 'Not available on this device'
  }
  return authStore.isBiometricEnabled
    ? `Enabled — next time, ${biometricLabel.value} skips the password.`
    : `Off — turn on to sign back in without your password.`
})

async function onToggle(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  isBusy.value = true
  message.value = null
  try {
    if (checked) {
      const result = await authStore.enableBiometric()
      messageOk.value = result.success
      message.value = result.success
        ? `${biometricLabel.value} sign-in enabled.`
        : result.error || 'Could not enable biometric sign-in'
      if (!result.success) (event.target as HTMLInputElement).checked = false
    } else {
      await authStore.disableBiometric()
      messageOk.value = true
      message.value = `${biometricLabel.value} sign-in disabled.`
    }
  } finally {
    isBusy.value = false
  }
}

async function onSignOut() {
  await authStore.signout()
  router.replace('/login')
}
</script>

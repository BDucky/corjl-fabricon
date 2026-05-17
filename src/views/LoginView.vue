<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-ground px-4">
    <!-- Background gradient -->
    <div class="fixed inset-0 bg-gradient-to-br from-primary-dark/30 via-surface-ground to-surface-ground pointer-events-none" />

    <div class="relative w-full max-w-md animate-scale-in">
      <!-- Logo -->
      <div class="mb-8">
        <CorjlLogo size="lg" centered />
      </div>

      <!-- Glass card -->
      <div class="glass-panel--elevated p-8">
        <h2 class="text-center text-xl font-semibold text-[var(--text-primary)] mb-6">
          Sign in to your account
        </h2>

        <!-- Biometric quick-sign-in (only when enabled + available) -->
        <div v-if="showBiometric" class="mb-5 space-y-3">
          <BaseButton
            type="button"
            variant="secondary"
            full-width
            :is-loading="isBiometricLoading"
            @click="handleBiometricLogin"
          >
            Sign in with {{ biometricLabel }}
          </BaseButton>
          <div class="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span class="flex-1 h-px bg-[var(--border-subtle)]" />
            <span>or use your password</span>
            <span class="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>
        </div>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <BaseInput
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            label="Email"
            required
            :error="errors.email"
            @blur="validateField('email')"
          />
          <BaseInput
            v-model="form.password"
            type="password"
            placeholder="Your password"
            label="Password"
            required
            :error="errors.password"
            @blur="validateField('password')"
          />

          <div v-if="error" class="rounded-[var(--radius-md)] bg-cta/10 border border-cta/20 p-3">
            <p class="text-sm font-medium text-cta">
              {{ error }}
            </p>
          </div>

          <BaseButton
            type="submit"
            variant="primary"
            full-width
            :is-loading="isLoading"
          >
            Sign in
          </BaseButton>

          <div class="text-center">
            <p class="text-sm text-[var(--text-muted)]">
              Don't have an account?
              <RouterLink
                to="/signup"
                class="font-medium text-accent hover:text-accent-hover transition-colors"
              >
                Sign up
              </RouterLink>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import BaseInput from '@components/ui/BaseInput.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import CorjlLogo from '@components/ui/CorjlLogo.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)
const isBiometricLoading = ref(false)
const error = ref('')

const biometricLabel = computed(() => authStore.biometricAvailability.label ?? 'biometrics')
const showBiometric = computed(
  () => authStore.isBiometricEnabled && authStore.biometricAvailability.isAvailable,
)

const handleBiometricLogin = async () => {
  isBiometricLoading.value = true
  error.value = ''
  const result = await authStore.signinWithBiometric()
  if (result.success) {
    router.push('/designs')
  } else {
    error.value = result.error || 'Biometric sign-in failed'
  }
  isBiometricLoading.value = false
}

const validateField = (field: keyof typeof form) => {
  if (field === 'email') {
    errors.email = form.email ? '' : 'Email is required'
  } else if (field === 'password') {
    errors.password = form.password ? '' : 'Password is required'
  }
}

const handleLogin = async () => {
  validateField('email')
  validateField('password')

  if (errors.email || errors.password) return

  isLoading.value = true
  error.value = ''

  const result = await authStore.signin(form.email, form.password)

  if (result.success) {
    router.push('/designs')
  } else {
    error.value = result.error || 'Login failed'
  }

  isLoading.value = false
}
</script>

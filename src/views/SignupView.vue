<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-ground px-4">
    <!-- Background gradient -->
    <div class="fixed inset-0 bg-gradient-to-br from-primary-dark/30 via-surface-ground to-surface-ground pointer-events-none" />

    <div class="relative w-full max-w-md animate-scale-in">
      <!-- Logo -->
      <div class="mb-8">
        <CorjlLogo size="lg" centered />
      </div>

      <!-- Step indicator -->
      <div class="flex items-center justify-center gap-3 mb-6">
        <div
          :class="[
            'w-2.5 h-2.5 rounded-full transition-all duration-normal',
            step === 'signup' ? 'bg-accent scale-125' : 'bg-surface-3',
          ]"
        />
        <div class="w-8 h-px bg-surface-3" />
        <div
          :class="[
            'w-2.5 h-2.5 rounded-full transition-all duration-normal',
            step === 'verify' ? 'bg-accent scale-125' : 'bg-surface-3',
          ]"
        />
      </div>

      <!-- Glass card -->
      <div class="glass-panel--elevated p-8">
        <h2 class="text-center text-xl font-semibold text-[var(--text-primary)] mb-6">
          {{ step === 'signup' ? 'Create your account' : 'Verify your email' }}
        </h2>

        <!-- Sign up form -->
        <Transition name="panel-slide-left" mode="out-in">
          <form v-if="step === 'signup'" key="signup" class="space-y-4" @submit.prevent="handleSignup">
            <BaseInput
              v-model="form.displayName"
              type="text"
              placeholder="Your name"
              label="Display Name"
              required
              :error="errors.displayName"
              @blur="validateField('displayName')"
            />
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
              placeholder="Create a password"
              label="Password"
              required
              :error="errors.password"
              hint="At least 8 characters"
              @blur="validateField('password')"
            />
            <BaseInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="Confirm password"
              label="Confirm Password"
              required
              :error="errors.confirmPassword"
              @blur="validateField('confirmPassword')"
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
              Create account
            </BaseButton>

            <div class="text-center">
              <p class="text-sm text-[var(--text-muted)]">
                Already have an account?
                <RouterLink
                  to="/login"
                  class="font-medium text-accent hover:text-accent-hover transition-colors"
                >
                  Sign in
                </RouterLink>
              </p>
            </div>
          </form>

          <!-- Verification form -->
          <form v-else key="verify" class="space-y-5" @submit.prevent="handleVerify">
            <p class="text-center text-sm text-[var(--text-secondary)] mb-4">
              We've sent a verification code to
              <span class="text-accent font-medium">{{ form.email }}</span>
            </p>
            <BaseInput
              v-model="form.verificationCode"
              type="text"
              placeholder="Enter 6-digit code"
              label="Verification Code"
              required
              :error="errors.verificationCode"
            />

            <div v-if="error" class="rounded-[var(--radius-md)] bg-cta/10 border border-cta/20 p-3">
              <p class="text-sm font-medium text-cta">
                {{ error }}
              </p>
            </div>

            <div class="space-y-3">
              <BaseButton
                type="submit"
                variant="primary"
                full-width
                :is-loading="isLoading"
              >
                Verify email
              </BaseButton>
              <BaseButton
                type="button"
                variant="secondary"
                full-width
                @click="resendCode"
              >
                Resend code
              </BaseButton>
            </div>

            <div class="text-center">
              <button
                type="button"
                class="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
                @click="step = 'signup'"
              >
                Back to sign up
              </button>
            </div>
          </form>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import BaseInput from '@components/ui/BaseInput.vue'
import BaseButton from '@components/ui/BaseButton.vue'
import CorjlLogo from '@components/ui/CorjlLogo.vue'

const router = useRouter()
const authStore = useAuthStore()

type Step = 'signup' | 'verify'

const step = ref<Step>('signup')

const form = reactive({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
})

const errors = reactive({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
})

const isLoading = ref(false)
const error = ref('')

const validateField = (field: keyof typeof form) => {
  switch (field) {
    case 'displayName':
      errors.displayName = form.displayName ? '' : 'Display name is required'
      break
    case 'email':
      errors.email = form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '' : 'Valid email is required'
      break
    case 'password':
      errors.password = form.password && form.password.length >= 8 ? '' : 'Password must be at least 8 characters'
      break
    case 'confirmPassword':
      errors.confirmPassword = form.password === form.confirmPassword ? '' : 'Passwords do not match'
      break
  }
}

const handleSignup = async () => {
  Object.keys(form).forEach((key) => {
    if (key !== 'verificationCode') {
      validateField(key as keyof typeof form)
    }
  })

  if (Object.values(errors).some((e) => e)) return

  isLoading.value = true
  error.value = ''

  const result = await authStore.signup(form.email, form.password, form.displayName)

  if (result.success) {
    step.value = 'verify'
  } else {
    error.value = result.error || 'Signup failed'
  }

  isLoading.value = false
}

const handleVerify = async () => {
  if (!form.verificationCode) {
    errors.verificationCode = 'Verification code is required'
    return
  }

  isLoading.value = true
  error.value = ''

  const result = await authStore.confirmSignup(form.email, form.verificationCode)

  if (result.success) {
    const loginResult = await authStore.signin(form.email, form.password)
    if (loginResult.success) {
      router.push('/designs')
    } else {
      error.value = loginResult.error || 'Failed to sign in'
    }
  } else {
    error.value = result.error || 'Verification failed'
  }

  isLoading.value = false
}

const resendCode = async () => {
  isLoading.value = true
  error.value = ''

  const result = await authStore.resendCode(form.email)

  if (!result.success) {
    error.value = result.error || 'Failed to resend code'
  }

  isLoading.value = false
}
</script>

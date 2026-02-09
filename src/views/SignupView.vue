<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900">
          Create your Fabricon account
        </h2>
      </div>

      <!-- Sign up form -->
      <form v-if="step === 'signup'" class="mt-8 space-y-6" @submit.prevent="handleSignup">
        <div class="rounded-md shadow-sm -space-y-px">
          <BaseInput
            v-model="form.displayName"
            type="text"
            placeholder="Display name"
            label="Display Name"
            required
            :error="errors.displayName"
            @blur="validateField('displayName')"
          />
          <BaseInput
            v-model="form.email"
            type="email"
            placeholder="Email address"
            label="Email"
            required
            :error="errors.email"
            @blur="validateField('email')"
          />
          <BaseInput
            v-model="form.password"
            type="password"
            placeholder="Password"
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
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <p class="text-sm font-medium text-red-800">
            {{ error }}
          </p>
        </div>

        <div>
          <BaseButton
            type="submit"
            variant="primary"
            class="w-full"
            :is-loading="isLoading"
          >
            Create account
          </BaseButton>
        </div>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            Already have an account?
            <RouterLink to="/login" class="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </RouterLink>
          </p>
        </div>
      </form>

      <!-- Verification form -->
      <form v-else class="mt-8 space-y-6" @submit.prevent="handleVerify">
        <div>
          <p class="text-center text-sm text-gray-600 mb-4">
            We've sent a verification code to {{ form.email }}
          </p>
          <BaseInput
            v-model="form.verificationCode"
            type="text"
            placeholder="Verification code"
            label="Verification Code"
            required
            :error="errors.verificationCode"
          />
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <p class="text-sm font-medium text-red-800">
            {{ error }}
          </p>
        </div>

        <div class="space-y-2">
          <BaseButton
            type="submit"
            variant="primary"
            class="w-full"
            :is-loading="isLoading"
          >
            Verify email
          </BaseButton>
          <BaseButton
            type="button"
            variant="secondary"
            class="w-full"
            @click="resendCode"
          >
            Resend code
          </BaseButton>
        </div>

        <div class="text-center">
          <button
            type="button"
            class="text-sm font-medium text-blue-600 hover:text-blue-500"
            @click="step = 'signup'"
          >
            Back to sign up
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import BaseInput from '@components/ui/BaseInput.vue'
import BaseButton from '@components/ui/BaseButton.vue'

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
    // Sign in automatically
    const loginResult = await authStore.signin(form.email, form.password)
    if (loginResult.success) {
      router.push('/projects')
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
